import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RootState } from "./reduxtoolkit/store";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { setUsername } from "./reduxtoolkit/socketSlice";
const uploadedFiles = useSelector(
  (state: RootState) => state.socket.uploadedFiles
);

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  const dispatch = useDispatch(); 
  const handleLogout = async () => {
      try {
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
          method: "GET",
          credentials: "include", // Ensures cookies are included in the request
        });
        const data = await response.json();
        if (response.ok) {
          dispatch(setUsername(null));
          // router.push("/login"); // Redirect to login page after logout
        } else {
          console.error("Logout failed");
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    };
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {uploadedFiles.map((item:any, i:any) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton asChild>
                    <Button variant="outline" onClick={handleLogout}>
                      {item.filename}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
