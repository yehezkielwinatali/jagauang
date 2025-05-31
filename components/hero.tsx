"use client";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import { motion } from "framer-motion";

const HeroSection = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      const imageElement = imageRef.current;
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;
      if (imageElement) {
        if (scrollPosition > scrollThreshold) {
          imageElement.classList.add("scrolled");
        } else {
          imageElement.classList.remove("scrolled");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div className="pb-20 px-4">
      <motion.div
        className="container mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
          Track your expenses <br /> with Intelligence
        </h1>
        <p className="text-md text-gray-600 mb-6 max-w-2xl mx-auto py-2">
          JagaUang is an AI-powered tool designed to help you manage and track
          your finances effortlessly.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 cursor-pointer">
              Get Started
            </Button>
          </Link>
          <Link href="https://github.com/yehezkielwinatali">
            <Button size="lg" variant="outline" className="px-8 cursor-pointer">
              Go to Our GitHub
            </Button>
          </Link>
        </div>
      </motion.div>
      <div className="hero-image-wrapper">
        <div ref={imageRef} className="hero-image">
          <Image
            src="/banner.jpeg"
            width={1280}
            height={720}
            alt="herobanner"
            priority
            className="rounded-lg shadow-2xl border mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
