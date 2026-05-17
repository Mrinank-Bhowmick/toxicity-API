import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ClassifyDto, ClassifyResponse } from './dto/classify.dto';
import { ToxicityService } from './toxicity.service';

@Controller()
export class ToxicityController {
  constructor(private readonly toxicity: ToxicityService) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  async classify(@Body() body: ClassifyDto): Promise<ClassifyResponse> {
    return this.toxicity.classify(body.message);
  }
}
