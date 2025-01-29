import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
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
@UseGuards(JwtGuard,RoleGuard)
@Controller({
  path: 'wallet/',
  version: '1',
})
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Roles(Role.RIDER)
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


  @Roles(Role.ADMIN)
  @Post('transfer-to-wallet/:riderID/:orderID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<any>) },
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
  @ApiOperation({ summary: 'initialize fun transfer from admin to rider' })
  async Fundwallet(
    @Param('riderID') riderId:string,
    @Param('orderID') orderID: string,
  ): Promise<StandardResponse<any>> {
    return await this.walletService.FundWallet(riderId,orderID);
  }
}
