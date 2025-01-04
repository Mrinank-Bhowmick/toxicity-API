const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-gray-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Toxicity Detector API
            </h3>
            <p className="text-gray-400">
              Helping create safer online spaces through advanced content
              analysis
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#api-reference"
                  className="hover:text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("api-reference")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Mrinank-Bhowmick/toxicity"
                  className="hover:text-white"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact</h3>
            <p className="text-gray-400">
              Have questions? Reach out to us on GitHub
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p>
            &copy; {new Date().getFullYear()} Toxicity Detector. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
