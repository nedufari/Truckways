import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Roles } from 'src/Auth/Decorator/role.decorator';
import { JwtGuard } from 'src/Auth/Guard/jwt.guard';
import { RoleGuard } from 'src/Auth/Guard/role.guard';
import { Role } from 'src/Enums/users.enum';
import { WalletService } from './wallet.service';
import { CashoutDto } from './dto/cashout.dto';
import { Transactions } from 'src/Rider/Domain/transaction';
import { StandardResponse } from 'src/utils/services/response.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'wallet/',
  version: '1',
})
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('initialize-cashout')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Transactions>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Transactions),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'initialize funds cashout from wallet for the rider' })
  async cashoutFunds(
    @Req() req,
    @Body() dto: CashoutDto,
  ): Promise<StandardResponse<Transactions>> {
    return await this.walletService.cashout(req.user, dto);
  }
}
