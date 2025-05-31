import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";
import { checkUser } from "@/lib/checkUser";
const Header = async () => {
  await checkUser();
  return (
    <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <h1 className="font-bold text-2xl pl-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-black hover:text-transparent hover:bg-clip-text hover:from-blue-500 hover:to-purple-500 transition duration-300">
            JagaUang
          </h1>
        </Link>

        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link
              href={"/dashboard"}
              className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
            >
              <Button variant="outline" className="cursor-pointer">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <Link
              href={"/transaction/create"}
              className="flex items-center gap-2"
            >
              <Button className="cursor-pointer">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline" className="cursor-pointer">
                Login
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default Header;
