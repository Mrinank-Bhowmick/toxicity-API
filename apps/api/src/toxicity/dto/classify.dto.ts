import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ClassifyDto {
  @IsString()
  @IsNotEmpty({ message: 'Message arguement is required.' })
  @MaxLength(1000, {
    message: 'Message contains greater than 1000 characters.',
  })
  message!: string;
}

export interface ToxicResponse {
  isToxic: true;
  score: number;
  flaggedFor: string;
}

export interface CleanResponse {
  isToxic: false;
  score: number;
}

export type ClassifyResponse = ToxicResponse | CleanResponse;
