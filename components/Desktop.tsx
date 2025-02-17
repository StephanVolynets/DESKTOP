"use client";

import { useWindows } from "@/contexts/WindowsContext";
import Window from "@/components/Window";
import {
  FileText,
  Terminal,
  Calculator,
  Image,
  Folder,
  Info,
  Monitor,
  Users,
  FileEdit,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ContextMenu } from "./desktop/ContextMenu";
import { DesktopGrid } from "./desktop/DesktopGrid";
import { FileExplorer } from "./FileExplorer";
import { AboutMeContent } from "./AboutMeContent";
import { TextEditor } from "./TextEditor";
import { useContextMenu } from "@/hooks/useContextMenu";
import { generateRandomColor } from "@/lib/utils";
import type { AppIcon, WindowContent } from "@/types/global";
import { Calculator as CalculatorApp } from "./Calculator";

export default function Desktop() {
  const { windows, openWindow, isWindowOpen, focusWindow } = useWindows();
  const desktopRef = useRef<HTMLDivElement>(null);
  const { menuProps, handleContextMenu, closeMenu } = useContextMenu({ containerRef: desktopRef });
  const [icons, setIcons] = useState<AppIcon[]>([
    { id: "myPC", title: "My PC", icon: Monitor, x: 0, y: 0, color: "text-indigo-400", type: "app" },
    { id: "public", title: "Public", icon: Users, x: 1, y: 0, color: "text-pink-400", type: "folder" },
    { id: "terminal", title: "Terminal", icon: Terminal, x: 0, y: 1, color: "text-green-400", type: "app" },
    { id: "aboutMe", title: "About Me", icon: Info, x: 1, y: 1, color: "text-cyan-400", type: "file" },
    { id: "calculator", title: "Calculator", icon: Calculator, x: 0, y: 2, color: "text-yellow-400", type: "app" },
    { id: "textEditor", title: "Text Editor", icon: FileEdit, x: 1, y: 2, color: "text-orange-400", type: "app" },
    { id: "imageViewer", title: "Images", icon: Image, x: 0, y: 3, color: "text-purple-400", type: "app" },
    { id: "notepad", title: "Notepad", icon: FileText, x: 1, y: 3, color: "text-blue-400", type: "app" },
  ]);

  const [editingIcon, setEditingIcon] = useState<string | null>(null);
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());

  const getRandomWindowPosition = useCallback((width: number, height: number) => {
    const centerX = (window.innerWidth - width) / 2;
    const centerY = (window.innerHeight - height - 48) / 2;
    const maxOffset = Math.min(200, Math.min(centerX, centerY) / 2);
    
    const offsetX = (Math.random() - 0.5) * maxOffset * 2;
    const offsetY = (Math.random() - 0.5) * maxOffset * 2;

    return {
      x: Math.max(0, Math.min(window.innerWidth - width, centerX + offsetX)),
      y: Math.max(0, Math.min(window.innerHeight - height - 48, centerY + offsetY))
    };
  }, []);

  const handleIconOpen = useCallback((icon: AppIcon) => {
    if (isWindowOpen(icon.id)) {
      focusWindow(icon.id);
      return;
    }

    const width = icon.id === 'textEditor' ? 800 : 600;
    const height = icon.id === 'textEditor' ? 600 : 400;
    const position = getRandomWindowPosition(width, height);

    const aboutMeContent = <AboutMeContent />;
    let content: WindowContent;

    switch (icon.id) {
      case 'myPC':
        content = {
          type: 'file-explorer',
          icons: icons.filter(i => i.id !== 'myPC'), // Exclude My PC from its own window
          aboutMeContent
        };
        break;
      case 'aboutMe':
        content = {
          type: 'about',
          content: aboutMeContent
        };
        break;
      case 'calculator':
        content = {
          type: 'default',
          content: <CalculatorApp />
        };
        break;
      case 'textEditor':
      case icon.type === 'file' && icon.id:
        content = {
          type: 'text-editor',
          id: icon.id
        };
        break;
      case 'terminal':
        content = {
          type: 'default',
          content: (
            <div className="font-mono p-4 bg-black text-green-400">
              <p>Terminal not implemented yet.</p>
              <p className="animate-pulse">▋</p>
            </div>
          )
        };
        break;
      case 'imageViewer':
        content = {
          type: 'default',
          content: (
            <div className="p-4">
              <p>Image Viewer not implemented yet.</p>
            </div>
          )
        };
        break;
      default:
        content = {
          type: 'default',
          content: `Content for ${icon.title}`
        };
    }

    openWindow({
      id: icon.id,
      title: icon.title,
      content,
      ...position,
      width: icon.id === 'calculator' ? 300 : width,
      height: icon.id === 'calculator' ? 450 : height,
    });
  }, [openWindow, isWindowOpen, focusWindow, icons, getRandomWindowPosition]);

  const findNextAvailablePosition = useCallback(() => {
    const maxY = Math.max(...icons.map(icon => icon.y)) + 1;
    return { x: 0, y: maxY };
  }, [icons]);

  const handleNewTextFile = useCallback(() => {
    const position = findNextAvailablePosition();
    const newId = `text-${Date.now()}`;
    const newIcon = {
      id: newId,
      title: "New Text File",
      icon: FileText,
      x: position.x,
      y: position.y,
      color: generateRandomColor(),
      type: "file" as const
    };
    setIcons(prev => [...prev, newIcon]);
    closeMenu();
    handleIconOpen(newIcon);
  }, [findNextAvailablePosition, closeMenu, handleIconOpen]);

  const handleNewFolder = useCallback(() => {
    const position = findNextAvailablePosition();
    const newId = `folder-${Date.now()}`;
    setIcons(prev => [...prev, {
      id: newId,
      title: "New Folder",
      icon: Folder,
      x: position.x,
      y: position.y,
      color: "text-neutral-400",
      type: "folder" as const
    }]);
    closeMenu();
  }, [findNextAvailablePosition, closeMenu]);

  const handleRenameIcon = useCallback((iconId: string) => {
    setEditingIcon(iconId);
    closeMenu();
  }, [closeMenu]);

  const handleRenameComplete = useCallback((iconId: string, newName: string) => {
    if (newName.trim()) {
      setIcons(prev => prev.map(icon => 
        icon.id === iconId ? { ...icon, title: newName } : icon
      ));
    }
    setEditingIcon(null);
  }, []);

  const handleDeleteIcon = useCallback((iconId: string) => {
    const icon = icons.find(i => i.id === iconId);
    if (icon && (icon.type === 'file' || icon.type === 'folder')) {
      setIcons(prev => prev.filter(icon => icon.id !== iconId));
    }
    closeMenu();
  }, [icons, closeMenu]);

  const handleDuplicateIcon = useCallback((iconId: string) => {
    const iconToDuplicate = icons.find(icon => icon.id === iconId);
    if (!iconToDuplicate || iconToDuplicate.type === 'app') return;

    const position = findNextAvailablePosition();
    const newIcon = {
      ...iconToDuplicate,
      id: `${iconToDuplicate.id}-${Date.now()}`,
      title: `${iconToDuplicate.title} Copy`,
      x: position.x,
      y: position.y,
      color: generateRandomColor()
    };

    setIcons(prev => [...prev, newIcon]);
    closeMenu();
  }, [icons, findNextAvailablePosition, closeMenu]);

  const handleOpenIcon = useCallback((iconId: string) => {
    const icon = icons.find(i => i.id === iconId);
    if (icon) {
      handleIconOpen(icon);
      closeMenu();
    }
  }, [icons, handleIconOpen, closeMenu]);

  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedIcons(new Set(selectedIds));
  }, []);

  return (
    <div
      ref={desktopRef}
      className={cn(
        "flex-1 relative overflow-hidden",
        "contain-layout"
      )}
      onContextMenu={(e) => handleContextMenu(e)}
    >
      <DesktopGrid
        icons={icons}
        onIconsChange={setIcons}
        onIconOpen={handleIconOpen}
        onContextMenu={handleContextMenu}
        editingIcon={editingIcon}
        onRenameComplete={handleRenameComplete}
        selectedIcons={selectedIcons}
        onSelectionChange={handleSelectionChange}
        columns={2}
      >
        {menuProps.isOpen && (
          <ContextMenu
            x={menuProps.position.x}
            y={menuProps.position.y}
            type={menuProps.type}
            onOpen={menuProps.targetId ? () => handleOpenIcon(menuProps.targetId!) : undefined}
            onNewTextFile={handleNewTextFile}
            onNewFolder={handleNewFolder}
            onRename={menuProps.targetId ? () => handleRenameIcon(menuProps.targetId!) : undefined}
            onDelete={menuProps.targetId ? () => handleDeleteIcon(menuProps.targetId!) : undefined}
            onDuplicate={menuProps.targetId ? () => handleDuplicateIcon(menuProps.targetId!) : undefined}
            onClose={closeMenu}
          />
        )}

        {windows.map((window) => (
          <Window key={window.id} {...window} />
        ))}
      </DesktopGrid>
    </div>
  );
}