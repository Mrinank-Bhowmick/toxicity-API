import React from "react";
import { FaStar } from "react-icons/fa";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex justify-center items-center w-full">
      <div className="fixed top-0 w-[90vw] bg-red-500 flex items-center justify-between md:px-10 md:py-2 px-5 py-1 rounded-full z-50 mt-[2vh]">
        <div className="font-bold font-sans text-xl md:text-3xl text-white">
          Toxicity API
        </div>
        <Link
          href={"https://github.com/Mrinank-Bhowmick/toxicity-API"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 md:mt-0 px-2 py-1 bg-red-300 rounded-lg font-semibold text-sm flex items-center gap-1"
        >
          Star On Github <FaStar />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
