import { DynamicModule, Module, Provider } from "@nestjs/common";
import { ImageStorageService } from "./image.service";
import { IMAGE_MODULE_OPTIONS } from "./image.constants";
import { ImageStorageStrategy } from "./interfaces/image-storage.interface";

@Module({})
export class ImageModule {
	static forRoot(options: {
		storage: ImageStorageStrategy;
		defaults?: import("./image.types").UploadImageOptions;
	}): DynamicModule {
		const providers: Provider[] = [
			ImageStorageService,
			{ provide: IMAGE_MODULE_OPTIONS, useValue: options },
			{ provide: ImageStorageStrategy, useValue: options.storage },
		];

		return {
			module: ImageModule,
			providers,
			exports: [ImageStorageService],
		};
	}
}
