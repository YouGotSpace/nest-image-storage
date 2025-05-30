import sharp from "sharp";

export interface FileUpload {
	fieldname: string;
	originalname: string;
	encoding: string;
	mimetype: string;
	buffer: Buffer;
	size: number;
}

export interface UploadImageOptions {
	convertTo?: "jpeg" | "png" | "webp";
	full?: {
		maxWidth?: number;
		maxHeight?: number;
		minWidth?: number;
		minHeight?: number;
	};
	thumbnail?: {
		maxWidth?: number;
		maxHeight?: number;
		minWidth?: number;
		minHeight?: number;
	};
}

export interface ImageValidationError {
	type: "validation_error";
	code: "dimensions_too_small" | "dimensions_too_large";
	message: string;
	details: {
		width: number;
		height: number;
		required?: {
			minWidth?: number;
			minHeight?: number;
			maxWidth?: number;
			maxHeight?: number;
		};
	};
}

export type ImageProcessingResult =
	| {
			type: "success";
			fullImage: sharp.Sharp;
			thumbImage: sharp.Sharp;
			ext: string;
			metadata: sharp.Metadata;
	  }
	| ImageValidationError;

export interface UploadImageResult {
	fullUrl: string;
	thumbUrl: string;
	mimeType: string;
	fileSize: number;
	originalFilename: string;
	width: number;
	height: number;
}
