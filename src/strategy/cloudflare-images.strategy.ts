import { LoggerService } from "@nestjs/common";
import axios from "axios";
import FormData from "form-data";
import { BaseImageStorageStrategy } from "./base-image-storage.strategy";
import sharp from "sharp";

export interface CloudflareImagesOptions {
	accountId: string;
	apiToken: string;
	variantFull?: string;
	variantThumb?: string;
}

export class CloudflareImagesStrategy extends BaseImageStorageStrategy {
	constructor(
		private readonly options: CloudflareImagesOptions,
		logger: LoggerService
	) {
		super(logger);
	}

	protected async storeImages(
		fullImage: sharp.Sharp,
		_thumbImage: sharp.Sharp,
		ext: string
	): Promise<{
		url: string;
		thumbnailUrl: string;
		fileSize: number;
	}> {
		const processedBuffer = await fullImage.toBuffer();

		const form = new FormData();
		form.append("file", processedBuffer, `image.${ext}`);

		try {
			const res = await axios.post(
				`https://api.cloudflare.com/client/v4/accounts/${this.options.accountId}/images/v1`,
				form,
				{
					headers: {
						Authorization: `Bearer ${this.options.apiToken}`,
						...form.getHeaders(),
					},
				}
			);

			const data = res.data?.result;
			if (!data?.id) {
				this.logger.error(
					"Failed to upload image to Cloudflare",
					res.data
				);
				throw new Error("Failed to upload image to Cloudflare");
			}

			return {
				url: this.getPublicUrl(data.id, "full"),
				thumbnailUrl: this.getPublicUrl(data.id, "thumb"),
				fileSize: data.size,
			};
		} catch (error: any) {
			this.logger.error(
				`Failed to upload to Cloudflare: ${error?.message || "Unknown error"}`
			);
			throw error;
		}
	}

	getPublicUrl(key: string, variant: "full" | "thumb"): string {
		const variantName =
			variant === "thumb" ?
				this.options.variantThumb || "thumbnail"
			:	this.options.variantFull || "public";
		return `https://imagedelivery.net/${key}/${variantName}`;
	}
}
