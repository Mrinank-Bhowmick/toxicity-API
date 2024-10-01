import { Box } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeSnippet = () => {
  const codeString = `const res = await fetch('https://toxicity.bhowmickmrinank.workers.dev/',{
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message }),
}); `;
  return (
    <div className="md:w-[60vw] w-[90vw]">
      <Box
        sx={{
          bgcolor: "#2d2d2d",
          p: 2,
          borderRadius: "16px" /* 2xl */,
          overflow: "hidden",
        }}
      >
        <SyntaxHighlighter
          language="javascript"
          style={materialDark}
          showLineNumbers
        >
          {codeString}
        </SyntaxHighlighter>
      </Box>
    </div>
  );
};

export default CodeSnippet;
