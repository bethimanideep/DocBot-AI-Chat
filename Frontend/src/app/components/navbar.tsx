import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, UserIcon } from "lucide-react";
import { ModeToggle } from "./darkmode/modeToggle";
import { Login } from "./login";
import { setUploadedFiles, setUserId, setUsername } from "./reduxtoolkit/socketSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./reduxtoolkit/store";
import Upload from "./upload";
import { Progress } from "@/components/ui/progress";
import { AdjustableFileSidebar } from "./AdjustableFileSidebar";
import { FileSidebar } from "./fileSidebar";
import { setDriveFiles } from "./reduxtoolkit/driveSlice";
import { useState } from "react";

export default function Navbar() {
  const username = useSelector((state: RootState) => state.socket.username);
  const isLoading = useSelector((state: RootState) => state.socket.isLoading);
  const progress = useSelector((state: RootState) => state.socket.progress);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const dispatch = useDispatch();
  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:4000/auth/logout", {
        method: "POST",
        credentials: "include", // Ensures cookies are included in the request
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        dispatch(setUsername(null));
        dispatch(setUploadedFiles([]as any));
        dispatch(setUserId(null));
        dispatch(setDriveFiles([]as any));
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  return (
    <div>
      <header className="flex sticky h-14 sm:h-16 md:h-20 w-full shrink-0 items-center px-2 sm:px-4 md:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:hidden">
              <MenuIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Toggle file sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetDescription></SheetDescription>
            <SheetTitle></SheetTitle>
            <FileSidebar onFileClick={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="#" className="mr-6 hidden lg:flex" prefetch={false}>
          <ShirtIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="sr-only">ShadCN</span>
        </Link>
        <div className="ml-auto flex gap-1 sm:gap-1.5 md:gap-2 items-center">
          {isLoading && (
            <div>
              <Progress value={progress} className="w-[100px] sm:w-[150px] md:w-[200px]" />
            </div>
          )}
          <div className="scale-90 sm:scale-95 md:scale-100">
            <Upload />
          </div>
          {!username ? (
            <div className="scale-90 sm:scale-95 md:scale-100">
              <Login />
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs px-2 sm:h-9 sm:px-3 sm:text-sm md:h-10 md:px-4 flex items-center gap-1"
                >
                  {username}
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="flex flex-col">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full rounded-none h-8 text-xs px-2 sm:h-9 sm:px-3 sm:text-sm flex items-center gap-2 justify-start" 
                  >
                    <UserIcon className="h-4 w-4" />
                    View Profile
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="w-full rounded-none h-8 text-xs px-2 sm:h-9 sm:px-3 sm:text-sm" 
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <div className="scale-90 sm:scale-95 md:scale-100">
            <ModeToggle />
          </div>
        </div>
      </header>
    </div>
  );
}

function MenuIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function ShirtIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}
