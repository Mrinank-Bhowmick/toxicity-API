"use client";
import React, { useState } from "react";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
interface ToxicityResult {
  isToxic: boolean;
  score: number;
  flaggedFor: string;
}

export function HeroSection() {
  const [prompt, setprompt] = useState(
    "This is the shittiest code, I've ever reviewed."
  );
  const [result, setResult] = useState("Results will be shown here");
  const [ToxicityResult, setToxicityResult] = useState<ToxicityResult | null>(
    null
  );

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setprompt(e.target.value);
  };
  const handlePostRequest = async (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.preventDefault;
    setResult("Loading...");
    const res = fetch("https://toxicity.bhowmickmrinank.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    const response = await res;
    const data: ToxicityResult = await response.json();
    setToxicityResult(data);
    console.log(data);
  };

  return (
    <BackgroundBeamsWithCollision>
      <h2 className="text-2xl relative z-10 md:text-4xl lg:text-7xl font-bold text-center text-black dark:text-white font-sans tracking-tight">
        <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
          <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 py-4">
            <span className="">Detect Toxicity In Sentence</span>
          </div>
          <div className="flex justify-center text-base tracking-normal">
            <div className="bg-gray-200 border border-gray-300 w-[80vw] md:w-[50vw] p-4 rounded-2xl">
              <div className="flex md:flex-row flex-col gap-3 items-center">
                <div className="bg-gray-800 text-white px-2 py-1 font-sans rounded-lg">
                  POST
                </div>
                <div className="md:text-normal text-sm">
                  toxicity.bhowmickmrinank.workers.dev/
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 justify-between items-center mb-4">
                <div className="bg-white rounded-2xl p-1 mt-4 border border-black w-full">
                  <textarea
                    value={prompt}
                    onChange={(e) => handleOnChange(e)}
                    className="w-full font-normal p-1 outline-none md:h-10 h-15 resize-none rounded-2xl"
                    placeholder="Type your sentence here"
                  />
                </div>
                <div
                  className="bg-red-500 text-white rounded-xl p-2 flex items-center h-10 gap-1 cursor-pointer hover:bg-red-400 "
                  onClick={(e) => handlePostRequest(e)}
                >
                  <div>Toxicity</div>
                  <div>Check</div>
                </div>
              </div>
              <div className="h-[20vh] w-full border-dotted border-gray-400 border-2 rounded-2xl flex justify-center items-center text-gray-400">
                {ToxicityResult ? (
                  <div>
                    <div>
                      {ToxicityResult.isToxic
                        ? "Toxicity Detected"
                        : "Clean Input"}
                    </div>
                    <div>Score (higher is worse): {ToxicityResult.score}</div>
                  </div>
                ) : (
                  result
                )}
              </div>
            </div>
          </div>
        </div>
      </h2>
    </BackgroundBeamsWithCollision>
  );
}
