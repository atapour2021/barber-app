import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Barbershop } from '../modules/barbershops/entities/barbershop.entity';
import { Barber } from '../modules/barbers/entities/barber.entity';
import { BarberService } from '../modules/barbers/entities/barber-service.entity';
import { Service } from '../modules/services/entities/service.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { PasswordResetToken } from '../modules/auth/entities/password-reset-token.entity';
import { Setting } from '../modules/admin/entities/setting.entity';
import { Educational } from '../modules/educational/entities/educational.entity';
import { Certificate } from '../modules/certificates/entities/certificate.entity';
import { Location } from '../modules/locations/entities/location.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';

const dbPath = process.env.DB_DATABASE || 'barber_db';

const ds = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  entities: [
    User,
    Barbershop,
    Barber,
    BarberService,
    Service,
    Appointment,
    RefreshToken,
    PasswordResetToken,
    Setting,
    Educational,
    Certificate,
    Location,
    Notification,
  ],
  synchronize: true,
  logging: false,
});

async function hash(p: string) {
  return bcrypt.hash(p, 10);
}

function isoFuture(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await ds.initialize();
  console.log('[seed] db', dbPath, 'connected');

  const userRepo = ds.getRepository(User);
  const shopRepo = ds.getRepository(Barbershop);
  const barberRepo = ds.getRepository(Barber);
  const bsRepo = ds.getRepository(BarberService);
  const svcRepo = ds.getRepository(Service);
  const apptRepo = ds.getRepository(Appointment);

  await ds.query('PRAGMA foreign_keys=OFF');
  for (const t of [
    'appointments',
    'barber_services',
    'services',
    'barbers',
    'barbershops',
    'locations',
    'notifications',
    'certificates',
    'educationals',
    'password_reset_tokens',
    'refresh_tokens',
    'settings',
  ]) {
    try {
      await ds.query(`DELETE FROM "${t}"`);
    } catch {}
  }
  try {
    await ds.query(`DELETE FROM "users" WHERE username != 'superadmin'`);
  } catch {}
  await ds.query('PRAGMA foreign_keys=ON');

  let superadmin = await userRepo.findOne({
    where: { username: 'superadmin' },
  });
  if (!superadmin) {
    superadmin = userRepo.create({
      nationalCode: '0000000000',
      name: 'Super',
      family: 'Admin',
      username: 'superadmin',
      password: await hash('SuperAdmin123!'),
      phoneNumber: '09123456789',
      role: 'super_admin',
      isActive: true,
    } as any);
    superadmin = await userRepo.save(superadmin as any);
    console.log('[seed] superadmin created');
  } else console.log('[seed] superadmin exists', superadmin.id);

  const pw = await hash('Password123!');
  const mkUser = (u: Partial<User> & { username: string }) =>
    userRepo.create({ ...u, password: pw, isActive: true } as any);

  const admin = await userRepo.save(
    mkUser({
      nationalCode: '1111111111',
      name: 'Admin',
      family: 'User',
      username: 'admin',
      phoneNumber: '09120000001',
      email: 'admin@barber.local',
      role: 'admin',
    }),
  );
  const barberU1 = await userRepo.save(
    mkUser({
      nationalCode: '2222222222',
      name: 'رضا',
      family: 'کاظمی',
      username: 'barber1',
      phoneNumber: '09120000002',
      email: 'barber1@barber.local',
      role: 'barber',
    }),
  );
  const barberU2 = await userRepo.save(
    mkUser({
      nationalCode: '3333333333',
      name: 'علی',
      family: 'حسینی',
      username: 'barber2',
      phoneNumber: '09120000003',
      email: 'barber2@barber.local',
      role: 'barber',
    }),
  );
  const cust1 = await userRepo.save(
    mkUser({
      nationalCode: '4444444444',
      name: 'مهدی',
      family: 'رضایی',
      username: 'customer1',
      phoneNumber: '09120000011',
      email: 'customer1@barber.local',
      role: 'customer',
    }),
  );
  const cust2 = await userRepo.save(
    mkUser({
      nationalCode: '5555555555',
      name: 'سارا',
      family: 'احمدی',
      username: 'customer2',
      phoneNumber: '09120000012',
      email: 'customer2@barber.local',
      role: 'customer',
    }),
  );
  const cust3 = await userRepo.save(
    mkUser({
      nationalCode: '6666666666',
      name: 'User',
      family: 'Test',
      username: 'user1',
      phoneNumber: '09120000013',
      email: 'user1@barber.local',
      role: 'user',
    }),
  );
  console.log(
    '[seed] users',
    [
      admin.username,
      barberU1.username,
      barberU2.username,
      cust1.username,
      cust2.username,
      cust3.username,
    ].join(', '),
  );

  const shop1 = await shopRepo.save(
    shopRepo.create({
      name: 'Neo Barber - سعادت‌آباد',
      description: 'شعبه اصلی سعادت‌آباد - بهترین استایل',
      address: 'تهران، سعادت‌آباد، میدان کاج، پلاک ۱۲',
      latitude: 35.775,
      longitude: 51.371,
      phoneNumber: '02111111111',
      logo: null,
      isActive: true,
      ownerId: admin.id,
    } as any),
  );
  const shop2 = await shopRepo.save(
    shopRepo.create({
      name: 'Classic Cuts - ولیعصر',
      description: 'شعبه ولیعصر - کلاسیک و مدرن',
      address: 'تهران، ولیعصر، بالاتر از پارک ملت',
      latitude: 35.69,
      longitude: 51.39,
      phoneNumber: '02122222222',
      logo: null,
      isActive: true,
      ownerId: admin.id,
    } as any),
  );
  console.log('[seed] shops', shop1.id, shop2.id);

  const wh: Record<string, { start: string; end: string }> = {
    monday: { start: '10:00', end: '21:00' },
    tuesday: { start: '10:00', end: '21:00' },
    wednesday: { start: '10:00', end: '21:00' },
    thursday: { start: '10:00', end: '21:00' },
    friday: { start: '10:00', end: '18:00' },
    saturday: { start: '10:00', end: '18:00' },
  };
  const br: Record<string, { start: string; end: string }> = {
    monday: { start: '14:00', end: '15:00' },
    tuesday: { start: '14:00', end: '15:00' },
    wednesday: { start: '14:00', end: '15:00' },
    thursday: { start: '14:00', end: '15:00' },
    friday: { start: '13:00', end: '14:00' },
    saturday: { start: '13:00', end: '14:00' },
  };

  const barber1 = await barberRepo.save(
    barberRepo.create({
      fullName: 'رضا کاظمی',
      bio: 'متخصص فید و استایل مردانه',
      profileImage: 'https://i.pravatar.cc/150?u=reza',
      specialties: ['fade', 'beard', 'styling'],
      workingDays: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ],
      workingHours: wh,
      breakTime: br,
      holidays: [],
      status: 'active',
      isAvailable: true,
      isActive: true,
      barbershopId: shop1.id,
      userId: barberU1.id,
    } as any),
  );
  const barber2 = await barberRepo.save(
    barberRepo.create({
      fullName: 'علی حسینی',
      bio: 'استاد کوتاهی کلاسیک',
      profileImage: 'https://i.pravatar.cc/150?u=ali',
      specialties: ['classic', 'scissors'],
      workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      workingHours: {
        sunday: { start: '09:00', end: '20:00' },
        monday: { start: '09:00', end: '20:00' },
        tuesday: { start: '09:00', end: '20:00' },
        wednesday: { start: '09:00', end: '20:00' },
        thursday: { start: '09:00', end: '20:00' },
      },
      breakTime: { start: '12:00', end: '13:00' } as any,
      holidays: [],
      status: 'active',
      isAvailable: true,
      isActive: true,
      barbershopId: shop2.id,
      userId: barberU2.id,
    } as any),
  );
  console.log('[seed] barbers', barber1.id, barber2.id);

  const s1 = await svcRepo.save(
    svcRepo.create({
      name: 'کوتاهی و استایل',
      description: 'کوتاهی حرفه‌ای با استایل',
      price: 250000,
      duration: 45,
      icon: 'cut',
      barberId: barber1.id,
      barbershopId: shop1.id,
    } as any),
  );
  const s2 = await svcRepo.save(
    svcRepo.create({
      name: 'اصلاح ریش',
      description: 'اصلاح و مرتب‌سازی ریش',
      price: 120000,
      duration: 30,
      icon: 'beard',
      barberId: barber1.id,
      barbershopId: shop1.id,
    } as any),
  );
  const s3 = await svcRepo.save(
    svcRepo.create({
      name: 'پکیج کامل',
      description: 'کوتاهی + ریش + استایل',
      price: 350000,
      duration: 60,
      icon: 'star',
      barberId: barber1.id,
      barbershopId: shop1.id,
    } as any),
  );
  const s4 = await svcRepo.save(
    svcRepo.create({
      name: 'کوتاهی کلاسیک',
      description: 'کوتاهی با قیچی',
      price: 200000,
      duration: 30,
      icon: 'scissors',
      barberId: barber2.id,
      barbershopId: shop2.id,
    } as any),
  );
  const s5 = await svcRepo.save(
    svcRepo.create({
      name: 'رنگ مو',
      description: 'رنگ و مش',
      price: 400000,
      duration: 90,
      icon: 'color',
      barberId: barber2.id,
      barbershopId: shop2.id,
    } as any),
  );
  console.log(
    '[seed] services',
    [s1.id, s2.id, s3.id, s4.id, s5.id].join(', '),
  );

  for (const [barberId, svc] of [
    [barber1.id, s1],
    [barber1.id, s2],
    [barber1.id, s3],
    [barber2.id, s4],
    [barber2.id, s5],
  ] as any) {
    await bsRepo.save(
      bsRepo.create({
        barberId,
        serviceId: svc.id,
        price: svc.price,
        duration: svc.duration,
      } as any),
    );
  }

  const d1 = isoFuture(1);
  const d2 = isoFuture(2);
  const d3 = isoFuture(3);

  const mkAppt = (
    date: string,
    start: string,
    duration: number,
    barberId: string,
    serviceId: string,
    userId: string,
    status: string,
    notes?: string,
  ) => {
    const st = new Date(`${date}T${start}:00.000Z`);
    const en = new Date(st.getTime() + duration * 60000);
    return {
      id: randomUUID(),
      date: new Date(date + 'T00:00:00.000Z') as any,
      startTime: st as any,
      endTime: en as any,
      status,
      notes: notes ?? (null as any),
      barberId,
      serviceId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  };

  const apptRows = [
    mkAppt(
      d1,
      '10:00',
      45,
      barber1.id,
      s1.id,
      cust1.id,
      'pending',
      'لطفا دقیق باشید',
    ),
    mkAppt(d1, '11:00', 30, barber1.id, s2.id, cust2.id, 'confirmed'),
    mkAppt(
      d1,
      '14:30',
      60,
      barber1.id,
      s3.id,
      cust1.id,
      'cancelled',
      'کنسل شد',
    ),
    mkAppt(d2, '15:00', 90, barber2.id, s5.id, cust3.id, 'completed'),
    mkAppt(d2, '10:00', 30, barber2.id, s4.id, cust2.id, 'pending'),
    mkAppt(d3, '16:00', 45, barber1.id, s1.id, cust3.id, 'confirmed'),
  ];
  for (const a of apptRows) {
    await ds.query(
      `INSERT INTO "appointments" ("id","date","startTime","endTime","status","notes","userId","barberId","serviceId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        a.id,
        (a.date as Date).toISOString(),
        (a.startTime as Date).toISOString(),
        (a.endTime as Date).toISOString(),
        a.status,
        a.notes,
        a.userId,
        a.barberId,
        a.serviceId,
        (a.createdAt as Date).toISOString(),
        (a.updatedAt as Date).toISOString(),
      ],
    );
  }
  console.log('[seed] appointments', apptRows.length, 'on', d1, d2, d3);

  try {
    const locRepo = ds.getRepository(Location);
    await locRepo.save(
      locRepo.create({
        address: 'سعادت‌آباد، میدان کاج',
        label: 'شعبه اصلی',
        latitude: 35.775,
        longitude: 51.371,
        barberId: barber1.id,
      } as any),
    );
    await locRepo.save(
      locRepo.create({
        address: 'ولیعصر، پارک ملت',
        label: 'شعبه ولیعصر',
        latitude: 35.69,
        longitude: 51.39,
        barberId: barber2.id,
      } as any),
    );
    console.log('[seed] locations done');
  } catch {}

  console.log(
    '\n[seed] DONE — credentials (all passwords Password123! except superadmin):',
  );
  console.log(' superadmin / SuperAdmin123!  (super_admin)');
  console.log(' admin      / Password123!     (admin)');
  console.log(' barber1    / Password123!     (barber - رضا کاظمی)');
  console.log(' barber2    / Password123!     (barber - علی حسینی)');
  console.log(' customer1  / Password123!     (customer - مهدی)');
  console.log(' customer2  / Password123!     (customer - سارا)');
  console.log(' user1      / Password123!     (user)');
  console.log(` shops: ${shop1.id} ${shop2.id}`);
  console.log(` barbers: ${barber1.id} ${barber2.id}`);
  console.log(` services: ${s1.id} ${s4.id}`);
  console.log(` dates: ${d1} ${d2} ${d3}`);

  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
