import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NeuralGridService } from './services/neural-grid.service';

@Global()
@Module({
    imports: [HttpModule],
    providers: [NeuralGridService],
    exports: [NeuralGridService],
})
export class NeuralGridModule { }
