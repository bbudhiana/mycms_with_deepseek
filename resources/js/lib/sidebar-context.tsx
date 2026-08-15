import * as React from 'react';

interface SidebarContextValue {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue>({ isOpen: false, setOpen: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setOpen] = React.useState(false);

    return <SidebarContext.Provider value={{ isOpen, setOpen }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
    return React.useContext(SidebarContext);
}
