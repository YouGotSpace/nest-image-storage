import { LoggerService } from "@nestjs/common";
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { BaseImageStorageStrategy } from "./base-image-storage.strategy";
import { ImageProcessingResult } from "../image.types";

export interface AwsS3StrategyOptions {
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	/**
	 * Optional prefix for all uploaded files
	 */
	prefix?: string;
	/**
	 * Optional custom domain for the S3 bucket
	 */
	customDomain?: string;
	/**
	 * URL expiration time in seconds for signed URLs
	 * @default 3600 (1 hour)
	 */
	urlExpiration?: number;
}

export class AwsS3Strategy extends BaseImageStorageStrategy {
	private readonly s3Client: S3Client;
	private readonly bucket: string;
	private readonly prefix: string;
	private readonly customDomain?: string;
	private readonly urlExpiration: number;

	constructor(
		private readonly options: AwsS3StrategyOptions,
		logger: LoggerService
	) {
		super(logger);
		this.s3Client = new S3Client({
			region: options.region,
			credentials: {
				accessKeyId: options.accessKeyId,
				secretAccessKey: options.secretAccessKey,
			},
		});
		this.bucket = options.bucket;
		this.prefix = options.prefix || "";
		this.customDomain = options.customDomain;
		this.urlExpiration = options.urlExpiration || 3600;
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
		const timestamp = Date.now();
		const fullKey = `${this.prefix}full/${timestamp}.${ext}`;
		const thumbKey = `${this.prefix}thumb/${timestamp}.${ext}`;

		// Get image buffers
		const [fullBuffer, thumbBuffer] = await Promise.all([
			fullImage.toBuffer(),
			thumbImage.toBuffer(),
		]);

		// Upload both images to S3
		await Promise.all([
			this.uploadToS3(fullKey, fullBuffer, ext),
			this.uploadToS3(thumbKey, thumbBuffer, ext),
		]);

		// Generate signed URLs
		const [fullUrl, thumbUrl] = await Promise.all([
			this.getSignedUrl(fullKey),
			this.getSignedUrl(thumbKey),
		]);

		return {
			url: fullUrl,
			thumbnailUrl: thumbUrl,
			fileSize: fullBuffer.length,
		};
	}

	private async uploadToS3(
		key: string,
		buffer: Buffer,
		contentType: string
	): Promise<void> {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			Body: buffer,
			ContentType: `image/${contentType}`,
		});

		try {
			await this.s3Client.send(command);
		} catch (error: any) {
			this.logger.error(
				`Failed to upload image to S3: ${error?.message || "Unknown error"}`
			);
			throw error;
		}
	}

	private async getSignedUrl(key: string): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});

		try {
			if (this.customDomain) {
				return `${this.customDomain}/${key}`;
			}

			return await getSignedUrl(this.s3Client, command, {
				expiresIn: this.urlExpiration,
			});
		} catch (error: any) {
			this.logger.error(
				`Failed to generate signed URL: ${error?.message || "Unknown error"}`
			);
			throw error;
		}
	}

	getPublicUrl(key: string, variant: "full" | "thumb"): string {
		if (this.customDomain) {
			return `${this.customDomain}/${key}`;
		}

		return `https://${this.bucket}.s3.${this.options.region}.amazonaws.com/${key}`;
	}
}
