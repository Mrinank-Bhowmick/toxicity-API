"use client";
import CodeSnippet from "@/components/CodeSnippet";
import { HeroSection } from "@/components/heroSection";
import Navbar from "@/components/navbar";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/FooterSection";
import React from "react";

const Page = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <div
        className="flex flex-col items-center justify-center w-full bg-neutral-400"
        id="api-reference"
      >
        <div className="font-bold text-4xl text-center mt-16 mb-10">
          Make an API request
        </div>
        <div>
          <CodeSnippet />
        </div>
        <div className="h-[20vh]"></div>
      </div>
      <Footer />
    </>
  );
};

export default Page;
