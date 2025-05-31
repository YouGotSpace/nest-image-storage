import { LoggerService } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { BaseImageStorageStrategy } from "./base-image-storage.strategy";
import sharp from "sharp";

export interface LocalStorageOptions {
	basePath: string;
	publicUrl: string;
}

export class LocalStorageStrategy extends BaseImageStorageStrategy {
	constructor(
		private readonly options: LocalStorageOptions,
		logger: LoggerService
	) {
		super(logger);
		if (!fs.existsSync(this.options.basePath)) {
			this.logger.log(
				`Creating base directory: ${this.options.basePath}`
			);
			fs.mkdirSync(this.options.basePath, { recursive: true });
		}
	}

	protected async storeImages(
		fullImage: sharp.Sharp,
		thumbImage: sharp.Sharp,
		ext: string
	): Promise<{
		url: string;
		thumbnailUrl: string;
		fileSize: number;
	}> {
		const id = randomUUID();
		const filenameBase = `${id}.${ext}`;
		const thumbFilename = `${id}_thumb.${ext}`;

		const fullPath = path.join(this.options.basePath, filenameBase);
		const thumbPath = path.join(this.options.basePath, thumbFilename);

		try {
			await fullImage.toFile(fullPath);
			await thumbImage.toFile(thumbPath);
		} catch (error: any) {
			this.logger.error(
				`Failed to save images: ${error?.message || "Unknown error"}`
			);
			throw error;
		}

		const stats = fs.statSync(fullPath);

		return {
			url: this.getPublicUrl(filenameBase, "full"),
			thumbnailUrl: this.getPublicUrl(thumbFilename, "thumb"),
			fileSize: stats.size,
		};
	}

	getPublicUrl(key: string, _variant: "full" | "thumb"): string {
		return `${this.options.publicUrl}/${key}`;
	}
}
