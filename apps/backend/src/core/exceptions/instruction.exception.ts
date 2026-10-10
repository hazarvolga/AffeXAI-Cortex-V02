import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for brand instruction and BCC orchestration errors.
 */
export class InstructionException extends HttpException {
    constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
        super(
            {
                success: false,
                message: message || 'Instruction execution failed',
                error: 'InstructionException',
            },
            status,
        );
    }
}
