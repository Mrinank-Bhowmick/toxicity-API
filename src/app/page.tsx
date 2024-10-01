import CodeSnippet from "@/components/CodeSnippet";
import { HeroSection } from "@/components/heroSection";
import Navbar from "@/components/navbar";
import React from "react";

const Page = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <div className="flex flex-col items-center justify-center w-full bg-neutral-400">
        <div className="font-bold text-3xl text-center mt-5 mb-5">
          Make an API request
        </div>
        <div>
          <CodeSnippet />
        </div>
        <div className="h-[20vh]"></div>
      </div>
    </>
  );
};

export default Page;
