import PostRequest from "@/components/postRequest";
import React from "react";

const Page = () => {
  return (
    <div className="h-screen">
      <div className="flex justify-center text-3xl">
        Detect Toxicity In Sentence
      </div>
      <PostRequest />
    </div>
  );
};

export default Page;
