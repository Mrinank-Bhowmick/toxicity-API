import { SiCloudflare } from "react-icons/si";
import { BiSearchAlt } from "react-icons/bi";
import { TbBrandNextjs } from "react-icons/tb";
import { SiHono } from "react-icons/si";

const AboutSection = () => {
  const techStacks = [
    {
      name: "Cloudflare Workers",
      description: "Serverless compute platform for edge deployment",
      icon: <SiCloudflare className="text-[#F38020] text-4xl" />,
    },
    {
      name: "Vector Database",
      description: "High-performance similarity search for text analysis",
      icon: <BiSearchAlt className="text-blue-600 text-4xl" />,
    },
    {
      name: "Next.js",
      description: "React framework for production-grade applications",
      icon: <TbBrandNextjs className="text-black text-4xl" />,
    },
    {
      name: "Hono",
      description: "Ultrafast web framework for edge computing",
      icon: <SiHono className="text-red-500 text-4xl" />,
    },
  ];

  return (
    <section className="py-16 bg-neutral-400" id="about-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            About Our API
          </h2>
          <p className="text-xl text-gray-700 mb-12">
            Advanced text analysis API designed to detect harmful or abusive
            language with high precision
          </p>
        </div>

        <div className="text-2xl font-bold text-gray-700 mb-8 text-center">
          Tech Stacks
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {techStacks.map((tech) => (
            <div
              key={tech.name}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{tech.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{tech.name}</h3>
              <p className="text-gray-600">{tech.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
