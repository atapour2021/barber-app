import { Injectable } from '@nestjs/common';
@Injectable()
export class UploadsService {
  handle(file: any) { return { filename: file.filename, originalName: file.originalname, size: file.size, path: file.path }; }
}
