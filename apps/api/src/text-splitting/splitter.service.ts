import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

@Injectable()
export class SplitterService {
  private readonly semantic = new RecursiveCharacterTextSplitter({
    chunkSize: 10,
    chunkOverlap: 1,
    separators: [' '],
  });

  async splitSemantic(message: string): Promise<string[]> {
    if (message.length === 0) return [];
    if (message.split(' ').length === 1) return [];

    const docs = await this.semantic.createDocuments([message]);
    return docs.map((d) => d.pageContent);
  }
}
