# NestJS Image Module

A dynamic image upload module for NestJS supporting pluggable storage strategies (local filesystem, Cloudflare Images, etc.).

## Features

- 🖼️ Image upload and processing
- 📏 Automatic image resizing and thumbnail generation
- ✅ Image dimension validation
- 🔌 Pluggable storage strategies
- 🏗️ Built-in support for local storage and Cloudflare Images
- 🔒 Type-safe with TypeScript

## Installation

```bash
npm install @you-got-space/nest-image-storage
```

## Quick Start

### 1. Import the Module

```typescript
import {
	ImageModule,
	LocalStorageStrategy,
} from "@you-got-space/nest-image-storage";
import { Logger } from "@nestjs/common";

@Module({
	imports: [
		ImageModule.forRoot({
			storage: new LocalStorageStrategy(
				{
					basePath: "./uploads",
					publicUrl: "http://localhost:3000/uploads",
				},
				new Logger("ImageModule")
			),
			defaults: {
				full: {
					maxWidth: 1920,
					maxHeight: 1080,
				},
				thumbnail: {
					maxWidth: 300,
					maxHeight: 300,
				},
			},
		}),
	],
})
export class AppModule {}
```

### 2. Use the Service

```typescript
import { ImageStorageService } from "@you-got-space/nest-image-storage";
import {
	Controller,
	Post,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("images")
export class ImagesController {
	constructor(private readonly imageService: ImageStorageService) {}

	@Post("upload")
	@UseInterceptors(FileInterceptor("file"))
	async uploadImage(@UploadedFile() file: Express.Multer.File) {
		const result = await this.imageService.uploadImage(file, {
			full: {
				maxWidth: 1920,
				maxHeight: 1080,
				minWidth: 800,
				minHeight: 600,
			},
			thumbnail: {
				maxWidth: 300,
				maxHeight: 300,
			},
		});

		if (result.type === "validation_error") {
			return {
				error: result.message,
				details: result.details,
			};
		}

		return {
			fullUrl: result.fullUrl,
			thumbUrl: result.thumbUrl,
			width: result.width,
			height: result.height,
		};
	}
}
```

## Storage Strategies

### Local Storage

```typescript
import { LocalStorageStrategy } from "@you-got-space/nest-image-storage";

const strategy = new LocalStorageStrategy(
	{
		basePath: "./uploads", // Directory to store images
		publicUrl: "http://localhost:3000/uploads", // Base URL for accessing images
	},
	new Logger("ImageModule")
);
```

### Cloudflare Images

```typescript
import { CloudflareImagesStrategy } from "@you-got-space/nest-image-storage";

const strategy = new CloudflareImagesStrategy(
	{
		accountId: "your-account-id",
		apiToken: "your-api-token",
		variantFull: "public", // Optional: Cloudflare variant name for full images
		variantThumb: "thumbnail", // Optional: Cloudflare variant name for thumbnails
	},
	new Logger("ImageModule")
);
```

### AWS S3 Storage

```typescript
import { AwsS3Strategy } from "@you-got-space/nest-image-storage";

const strategy = new AwsS3Strategy(
	{
		region: "us-east-1",
		bucket: "your-bucket-name",
		accessKeyId: "your-access-key-id",
		secretAccessKey: "your-secret-access-key",
		prefix: "images/", // Optional: prefix for all uploaded files
		customDomain: "https://cdn.yourdomain.com", // Optional: custom domain for the S3 bucket
		urlExpiration: 3600, // Optional: URL expiration time in seconds (default: 1 hour)
	},
	new Logger("ImageModule")
);
```

The AWS S3 strategy supports:

- Automatic file organization with full/thumb prefixes
- Signed URLs with configurable expiration
- Custom domain support
- Proper content type setting
- Error handling and logging

## Image Options

```typescript
interface UploadImageOptions {
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
```

## Creating Custom Storage Strategies

You can create custom storage strategies by extending the `BaseImageStorageStrategy`:

```typescript
import { BaseImageStorageStrategy } from "@you-got-space/nest-image-storage";
import { LoggerService } from "@nestjs/common";
import sharp from "sharp";

export class CustomStorageStrategy extends BaseImageStorageStrategy {
	constructor(
		private readonly options: YourOptions,
		logger: LoggerService
	) {
		super(logger);
	}

	protected async storeImages(
		fullImage: sharp.Sharp,
		thumbImage: sharp.Sharp,
		ext: string
	): Promise<{
		fullUrl: string;
		thumbUrl: string;
		fileSize: number;
	}> {
		// Implement your storage logic here
		// Return the URLs and file size
	}

	getPublicUrl(key: string, variant: "full" | "thumb"): string {
		// Return the public URL for the given key and variant
	}
}
```

## Error Handling

The module provides structured error handling for image validation:

```typescript
interface ImageValidationError {
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
```

## License

MIT
