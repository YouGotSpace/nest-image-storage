import { ImageStorageStrategy } from "../interfaces/image-storage.interface";
import {
	UploadImageOptions,
	UploadImageResult,
	FileUpload,
	ImageValidationError,
	ImageProcessingResult,
} from "../image.types";
import { LoggerService } from "@nestjs/common";
import sharp from "sharp";
import * as path from "path";

export abstract class BaseImageStorageStrategy extends ImageStorageStrategy {
	constructor(logger: LoggerService) {
		super(logger);
	}

	protected validateDimensions(
		metadata: sharp.Metadata,
		opts?: UploadImageOptions
	): ImageValidationError | null {
		const { width = 0, height = 0 } = metadata;
		const { full } = opts || {};

		// Check minimum dimensions
		if (full?.minWidth && width < full.minWidth) {
			return {
				type: "validation_error",
				code: "dimensions_too_small",
				message: `Image width (${width}px) is smaller than minimum required width (${full.minWidth}px)`,
				details: {
					width,
					height,
					required: {
						minWidth: full.minWidth,
						minHeight: full.minHeight,
					},
				},
			};
		}

		if (full?.minHeight && height < full.minHeight) {
			return {
				type: "validation_error",
				code: "dimensions_too_small",
				message: `Image height (${height}px) is smaller than minimum required height (${full.minHeight}px)`,
				details: {
					width,
					height,
					required: {
						minWidth: full.minWidth,
						minHeight: full.minHeight,
					},
				},
			};
		}

		// Check maximum dimensions
		if (full?.maxWidth && width > full.maxWidth) {
			return {
				type: "validation_error",
				code: "dimensions_too_large",
				message: `Image width (${width}px) is larger than maximum allowed width (${full.maxWidth}px)`,
				details: {
					width,
					height,
					required: {
						maxWidth: full.maxWidth,
						maxHeight: full.maxHeight,
					},
				},
			};
		}

		if (full?.maxHeight && height > full.maxHeight) {
			return {
				type: "validation_error",
				code: "dimensions_too_large",
				message: `Image height (${height}px) is larger than maximum allowed height (${full.maxHeight}px)`,
				details: {
					width,
					height,
					required: {
						maxWidth: full.maxWidth,
						maxHeight: full.maxHeight,
					},
				},
			};
		}

		return null;
	}

	protected async processImage(
		file: FileUpload,
		opts?: UploadImageOptions
	): Promise<ImageProcessingResult> {
		const ext =
			opts?.convertTo || path.extname(file.originalname).slice(1);
		const image = sharp(file.buffer);
		const metadata = await image.metadata();

		// Validate dimensions
		const validationError = this.validateDimensions(metadata, opts);
		if (validationError) {
			return validationError;
		}

		// Process full image
		let full = image.clone();
		if (opts?.full?.maxWidth || opts?.full?.maxHeight) {
			full = full.resize({
				width: opts.full.maxWidth,
				height: opts.full.maxHeight,
				fit: "inside",
			});
		}

		// Process thumbnail
		let thumb = image.clone().resize({
			width: opts?.thumbnail?.maxWidth || 300,
			height: opts?.thumbnail?.maxHeight,
			fit: "inside",
		});

		return {
			type: "success",
			fullImage: full,
			thumbImage: thumb,
			ext,
			metadata,
		};
	}

	protected createUploadResult(
		fullUrl: string,
		thumbUrl: string,
		file: FileUpload,
		metadata: sharp.Metadata,
		fileSize: number,
		ext: string
	): UploadImageResult {
		return {
			fullUrl,
			thumbUrl,
			mimeType: `image/${ext}`,
			fileSize,
			originalFilename: file.originalname,
			width: metadata.width || 0,
			height: metadata.height || 0,
		};
	}

	async uploadImage(
		file: FileUpload,
		opts?: UploadImageOptions
	): Promise<UploadImageResult | ImageValidationError> {
		const result = await this.processImage(file, opts);

		if (result.type === "validation_error") {
			return result;
		}

		const { fullImage, thumbImage, ext, metadata } = result;

		// Get storage-specific data
		const storageResult = await this.storeImages(
			fullImage,
			thumbImage,
			ext
		);

		return this.createUploadResult(
			storageResult.fullUrl,
			storageResult.thumbUrl,
			file,
			metadata,
			storageResult.fileSize,
			ext
		);
	}

	protected abstract storeImages(
		fullImage: sharp.Sharp,
		thumbImage: sharp.Sharp,
		ext: string
	): Promise<{
		fullUrl: string;
		thumbUrl: string;
		fileSize: number;
	}>;

	abstract getPublicUrl(key: string, variant: "full" | "thumb"): string;
}
