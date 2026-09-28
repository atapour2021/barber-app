import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { WalletService } from './wallet.service';
import {
  AdminAdjustDto,
  AdminTopupDto,
  AdminTransactionsQueryDto,
  AdminWalletsQueryDto,
  PayDto,
  TopupDto,
  WalletQueryDto,
  WithdrawDto,
} from './dto/wallet.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('me')
  @ApiOperation({ summary: 'Get my wallet balance' })
  me(@CurrentUser() user: any) {
    return this.wallet.getBalance(user.id);
  }

  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('transactions')
  @ApiOperation({ summary: 'List my wallet transactions' })
  transactions(@CurrentUser() user: any, @Query() q: WalletQueryDto) {
    return this.wallet.listTransactions(user.id, q);
  }

  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('topup')
  @ApiOperation({ summary: 'Top up my wallet' })
  topup(@CurrentUser() user: any, @Body() dto: TopupDto) {
    return this.wallet.topup(user.id, dto.amount, dto.description, user.id);
  }

  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('pay')
  @ApiOperation({ summary: 'Pay from wallet' })
  pay(@CurrentUser() user: any, @Body() dto: PayDto) {
    return this.wallet.pay(
      user.id,
      dto.amount,
      dto.description,
      dto.referenceId,
    );
  }

  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw / payout from wallet' })
  withdraw(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return this.wallet.withdraw(user.id, dto.amount, dto.description);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/stats')
  @ApiOperation({ summary: 'Wallet stats (admin)' })
  stats() {
    return this.wallet.adminStats();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/wallets')
  @ApiOperation({ summary: 'List wallets (admin)' })
  wallets(@Query() q: AdminWalletsQueryDto) {
    return this.wallet.adminWallets(q);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/wallets/:userId')
  @ApiOperation({ summary: 'Get wallet by userId (admin)' })
  walletByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.wallet.adminWalletByUserId(userId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/transactions')
  @ApiOperation({ summary: 'List all transactions (admin)' })
  transactionsAdmin(@Query() q: AdminTransactionsQueryDto) {
    return this.wallet.adminTransactions(q);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/topup')
  @ApiOperation({ summary: 'Credit user wallet (admin)' })
  adminTopup(@Body() dto: AdminTopupDto, @CurrentUser() actor: any) {
    return this.wallet.adminTopup(
      dto.userId,
      dto.amount,
      dto.description,
      actor.id,
    );
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/adjust')
  @ApiOperation({ summary: 'Adjust wallet balance (admin)' })
  adminAdjust(@Body() dto: AdminAdjustDto, @CurrentUser() actor: any) {
    return this.wallet.adminAdjust(
      dto.userId,
      dto.amount,
      dto.description,
      actor.id,
    );
  }
}
