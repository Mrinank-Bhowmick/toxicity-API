import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 10,
  chunkOverlap: 1,
  separators: [' '],
});

export async function splitSemantic(message: string): Promise<string[]> {
  if (message.length === 0) return [];
  if (message.split(' ').length === 1) return [];
  const docs = await splitter.createDocuments([message]);
  return docs.map((d) => d.pageContent);
}
