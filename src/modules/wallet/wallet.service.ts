import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import {
  WalletTransaction,
  WalletTxStatus,
  WalletTxType,
} from './entities/wallet-transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private txs: Repository<WalletTransaction>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  private async ensureUser(userId: string) {
    const u = await this.users.findOne({ where: { id: userId } });
    if (!u) throw new NotFoundException('User not found');
    if (!u.isActive) throw new BadRequestException('User inactive');
    return u;
  }

  async getOrCreate(userId: string): Promise<Wallet> {
    await this.ensureUser(userId);
    let w: Wallet | null = await this.wallets.findOne({
      where: { userId },
    });
    if (!w) {
      const created: any = this.wallets.create({
        userId,
        balance: 0 as any,
        currency: 'IRR',
        isActive: true,
      } as any);
      const saved: any = await this.wallets.save(created);
      w = (Array.isArray(saved) ? saved[0] : saved) as Wallet;
    }
    return w;
  }

  async getBalance(userId: string) {
    const w = await this.getOrCreate(userId);
    return {
      balance: Number((w as any).balance),
      currency: (w as any).currency,
      walletId: (w as any).id,
      userId,
    };
  }

  async listTransactions(userId: string, q: any) {
    await this.getOrCreate(userId);
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { userId };
    if (q.type) where.type = q.type;
    if (q.status) where.status = q.status;
    const [items, total] = await this.txs.findAndCount({
      where,
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  private async mutate(
    userId: string,
    amount: number,
    type: string,
    description?: string,
    referenceId?: string,
    actorId?: string,
    allowNegative = false,
  ) {
    if (!Number.isFinite(amount) || amount === 0)
      throw new BadRequestException('Invalid amount');
    return this.wallets.manager.transaction(async (em) => {
      const wRepo = em.getRepository(Wallet);
      const tRepo = em.getRepository(WalletTransaction);
      let w: Wallet | null = await wRepo.findOne({ where: { userId } });
      if (!w) {
        await this.ensureUser(userId);
        const created: any = wRepo.create({
          userId,
          balance: 0 as any,
          currency: 'IRR',
          isActive: true,
        } as any);
        const saved: any = await wRepo.save(created);
        w = (Array.isArray(saved) ? saved[0] : saved) as Wallet;
      }
      if (!(w as any).isActive)
        throw new BadRequestException('Wallet inactive');
      const cur = Number((w as any).balance);
      const next = cur + amount;
      if (!allowNegative && next < 0)
        throw new BadRequestException('Insufficient balance');
      (w as any).balance = next as any;
      await wRepo.save(w as any);
      const tx: any = tRepo.create({
        walletId: (w as any).id,
        userId,
        type,
        status: WalletTxStatus.COMPLETED,
        amount,
        balanceAfter: next as any,
        description: description ?? null,
        referenceId: referenceId ?? null,
        createdById: actorId ?? userId,
      } as any);
      const saved: any = await tRepo.save(tx);
      const transaction: WalletTransaction = (
        Array.isArray(saved) ? saved[0] : saved
      ) as WalletTransaction;
      return { wallet: w, transaction };
    });
  }

  async topup(
    userId: string,
    amount: number,
    description?: string,
    actorId?: string,
  ) {
    if (amount < 1000) throw new BadRequestException('Minimum topup 1000');
    const { wallet, transaction } = await this.mutate(
      userId,
      Math.abs(amount),
      WalletTxType.TOPUP,
      description,
      undefined,
      actorId || userId,
    );
    return { balance: Number((wallet as any).balance), transaction };
  }

  async pay(
    userId: string,
    amount: number,
    description?: string,
    referenceId?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const { wallet, transaction } = await this.mutate(
      userId,
      -Math.abs(amount),
      WalletTxType.PAYMENT,
      description,
      referenceId,
      userId,
    );
    return { balance: Number((wallet as any).balance), transaction };
  }

  async withdraw(userId: string, amount: number, description?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const { wallet, transaction } = await this.mutate(
      userId,
      -Math.abs(amount),
      WalletTxType.PAYOUT,
      description,
      undefined,
      userId,
    );
    return { balance: Number((wallet as any).balance), transaction };
  }

  async adminTopup(
    targetUserId: string,
    amount: number,
    description?: string,
    actorId?: string,
  ) {
    await this.ensureUser(targetUserId);
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const { wallet, transaction } = await this.mutate(
      targetUserId,
      Math.abs(amount),
      WalletTxType.CREDIT,
      description,
      undefined,
      actorId,
    );
    return { balance: Number((wallet as any).balance), transaction };
  }

  async adminAdjust(
    targetUserId: string,
    amount: number,
    description?: string,
    actorId?: string,
  ) {
    await this.ensureUser(targetUserId);
    if (amount === 0) throw new BadRequestException('Amount cannot be zero');
    const { wallet, transaction } = await this.mutate(
      targetUserId,
      amount,
      WalletTxType.ADJUSTMENT,
      description,
      undefined,
      actorId,
      true,
    );
    return { balance: Number((wallet as any).balance), transaction };
  }

  async adminWallets(q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const qb = this.wallets
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.user', 'user');
    if ((q.search || '').trim()) {
      const s = `%${(q.search || '').trim()}%`;
      qb.where(
        '(user.username LIKE :s OR user.name LIKE :s OR user.family LIKE :s OR user.phoneNumber LIKE :s)',
        { s },
      );
    }
    qb.orderBy('w.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    const data = items.map((w: any) => ({
      id: w.id,
      userId: w.userId,
      balance: Number(w.balance),
      currency: w.currency,
      isActive: w.isActive,
      user: w.user
        ? {
            id: w.user.id,
            username: w.user.username,
            name: w.user.name,
            family: w.user.family,
            phoneNumber: w.user.phoneNumber,
            role: w.user.role,
          }
        : null,
      updatedAt: w.updatedAt,
      createdAt: w.createdAt,
    }));
    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async adminWalletByUserId(userId: string) {
    await this.ensureUser(userId);
    const w = await this.getOrCreate(userId);
    const tx = await this.txs.find({
      where: { userId },
      order: { createdAt: 'DESC' } as any,
      take: 5,
    });
    return {
      wallet: {
        id: (w as any).id,
        userId: (w as any).userId,
        balance: Number((w as any).balance),
        currency: (w as any).currency,
        isActive: (w as any).isActive,
      },
      recentTransactions: tx,
    };
  }

  async adminTransactions(q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = {};
    if (q.userId) where.userId = q.userId;
    if (q.type) where.type = q.type;
    if (q.status) where.status = q.status;
    const [items, total] = await this.txs.findAndCount({
      where,
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async adminStats() {
    const walletsCount = await this.wallets.count();
    const txsCount = await this.txs.count();
    const sumRow: any = await this.txs
      .createQueryBuilder('t')
      .select(
        'COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END),0)',
        'inflow',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END),0)',
        'outflow',
      )
      .getRawOne();
    const totalBalanceRow: any = await this.wallets
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.balance),0)', 'total')
      .getRawOne();
    return {
      walletsCount,
      transactionsCount: txsCount,
      totalInflow: Number(sumRow?.inflow || 0),
      totalOutflow: Number(sumRow?.outflow || 0),
      totalBalance: Number(totalBalanceRow?.total || 0),
    };
  }
}
