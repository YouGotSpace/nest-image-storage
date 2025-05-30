// Module
export { ImageModule } from "./image.module";

// Service
export { ImageStorageService } from "./image.service";

// Interfaces and Types
export {
	FileUpload,
	UploadImageOptions,
	UploadImageResult,
	ImageValidationError,
	ImageProcessingResult,
} from "./image.types";

// Storage Strategies
export {
	LocalStorageStrategy,
	type LocalStorageOptions,
} from "./strategy/local-storage.strategy";
export {
	CloudflareImagesStrategy,
	type CloudflareImagesOptions,
} from "./strategy/cloudflare-images.strategy";
export {
	AwsS3Strategy,
	type AwsS3StrategyOptions,
} from "./strategy/aws-s3.strategy";
