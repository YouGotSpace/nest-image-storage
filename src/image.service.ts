import { Inject, Injectable, Logger } from "@nestjs/common";
import { IMAGE_MODULE_OPTIONS } from "./image.constants";
import {
	UploadImageOptions,
	UploadImageResult,
	FileUpload,
	ImageValidationError,
} from "./image.types";
import { ImageStorageStrategy } from "./interfaces/image-storage.interface";

@Injectable()
export class ImageStorageService {
	private readonly logger = new Logger(ImageStorageService.name);

	constructor(
		@Inject(IMAGE_MODULE_OPTIONS)
		private readonly options: {
			storage: ImageStorageStrategy;
			defaults?: UploadImageOptions;
		},
		@Inject(ImageStorageStrategy)
		private readonly storage: ImageStorageStrategy
	) {}

	async uploadImage(
		file: FileUpload,
		overrides?: UploadImageOptions
	): Promise<UploadImageResult | ImageValidationError> {
		const finalOptions: UploadImageOptions = {
			...this.options.defaults,
			...overrides,
		};

		return this.storage.uploadImage(file, finalOptions);
	}
}
