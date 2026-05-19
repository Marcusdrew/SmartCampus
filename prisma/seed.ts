import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed de la base de données...')

  // 1. Création de l'Administrateur par défaut
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { matricule: 'ADMIN' },
    update: {},
    create: {
      matricule: 'ADMIN',
      email: 'admin@ulc.edu',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log(`✅ Admin créé (Matricule: ${admin.matricule})`)

  // 2. Définition des Facultés et Promotions
  const facultiesData = [
    {
      name: 'Sciences Informatiques',
      promotions: [
        'L1', 'L2', 'L3',
        'M1 Conception de Système d\'Information',
        'M1 Réseaux',
        'M2 Conception de Système d\'Information',
        'M2 Réseaux'
      ]
    },
    {
      name: 'Économie',
      promotions: [
        'L1', 'L2', 'L3',
        'M1 Finances Banque et Assurance',
        'M1 Économie Quantitative et Gestion Informatique',
        'M2 Finances Banque et Assurance',
        'M2 Économie Quantitative et Gestion Informatique'
      ]
    },
    {
      name: 'Communication Sociale',
      promotions: [
        'L1', 'L2', 'L3',
        'M1 Communication des Organisations et Entreprises',
        'M1 Communication Socio-Éducative et Statistiques',
        'M2 Communication des Organisations et Entreprises',
        'M2 Communication Socio-Éducative et Statistiques'
      ]
    }
  ]

  // 3. Insertion dans la base de données
  for (const facData of facultiesData) {
    // Créer ou récupérer la faculté
    const faculty = await prisma.faculty.upsert({
      where: { name: facData.name },
      update: {},
      create: { name: facData.name },
    })

    console.log(`🎓 Faculté ajoutée : ${faculty.name}`)

    // Ajouter les promotions pour cette faculté
    for (const promoName of facData.promotions) {
      await prisma.promotion.upsert({
        // Pour garantir l'unicité promotion-faculté, on utilise @@unique dans le modèle
        where: {
          name_facultyId: {
            name: promoName,
            facultyId: faculty.id,
          }
        },
        update: {},
        create: {
          name: promoName,
          facultyId: faculty.id,
        },
      })
    }
    console.log(`   📚 ${facData.promotions.length} promotions ajoutées pour ${faculty.name}`)
  }

  console.log('✅ Seed terminé avec succès !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
