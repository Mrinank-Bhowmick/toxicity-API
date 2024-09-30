import React from "react";

const Navbar = () => {
  return (
    <div className="mt-[2vh] mb-[2vh] ml-[2vh] mr-[2vh] bg-red-500 h-[10vh] flex items-center justify-between p-10 rounded-full">
      <div className="font-bold text-2xl text-yellow-300">Toxicity API</div>
      <div className="p-2 bg-red-300 rounded-lg">Star On Github</div>
    </div>
  );
};

export default Navbar;
