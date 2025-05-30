import {
	UploadImageOptions,
	UploadImageResult,
	FileUpload,
	ImageValidationError,
} from "../image.types";
import { LoggerService } from "@nestjs/common";

export abstract class ImageStorageStrategy {
	constructor(protected logger: LoggerService) {}

	abstract uploadImage(
		file: FileUpload,
		options?: UploadImageOptions
	): Promise<UploadImageResult | ImageValidationError>;

	abstract getPublicUrl(key: string, variant: "full" | "thumb"): string;
}
