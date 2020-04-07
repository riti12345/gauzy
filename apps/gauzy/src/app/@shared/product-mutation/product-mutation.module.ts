import { NgModule } from '@angular/core';
import { ProductMutationComponent } from './product-mutation.component';
import { NgSelectModule } from '@ng-select/ng-select';
import {
	NbRadioModule,
	NbCardModule,
	NbIconModule,
	NbInputModule,
	NbCheckboxModule,
	NbButtonModule,
	NbSelectModule
} from '@nebular/theme';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from '../../@theme/components/header/selectors/employee/employee.module';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';

@NgModule({
	declarations: [ProductMutationComponent],
	imports: [
		ThemeModule,
		NgSelectModule,
		NbRadioModule,
		NbCardModule,
		NbIconModule,
		NbInputModule,
		NbButtonModule,
		FormsModule,
		ReactiveFormsModule,
		NbSelectModule,
		NbCheckboxModule,
		TranslateModule.forChild({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		})
	]
})
export class ProductMutationModule {}
