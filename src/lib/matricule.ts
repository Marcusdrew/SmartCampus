/**
 * Utilitaire pour la gestion et la vérification des matricules.
 */

// Expressions régulières pour la validation stricte
const STUDENT_MATRICULE_REGEX = /^\d{2}\/ULC\/\d{4}\/\d{2}$/;
const PROFESSOR_MATRICULE_REGEX = /^\d{2}\/ULC\/PRF\/\d{3}\/\d{2}$/;

/**
 * Valide le format d'un matricule étudiant (ex: 25/ULC/0001/26)
 */
export function isValidStudentMatricule(matricule: string): boolean {
  return STUDENT_MATRICULE_REGEX.test(matricule);
}

/**
 * Valide le format d'un matricule professeur/doyen (ex: 25/ULC/PRF/001/26)
 */
export function isValidProfessorMatricule(matricule: string): boolean {
  return PROFESSOR_MATRICULE_REGEX.test(matricule);
}

/**
 * Valide n'importe quel matricule ULC
 */
export function isValidSmartCampusMatricule(matricule: string): boolean {
  // Exception pour l'Admin par défaut créé dans le seed
  if (matricule === "ADMIN") return true;
  return isValidStudentMatricule(matricule) || isValidProfessorMatricule(matricule);
}

/**
 * Génère le matricule complet pour un étudiant.
 * @param academicYearStart L'année de début (ex: 2025)
 * @param count L'incrément (ex: 12)
 * @returns ex: 25/ULC/0012/26
 */
export function generateStudentMatriculeString(academicYearStart: number, count: number): string {
  const startYearShort = String(academicYearStart).slice(-2);
  const endYearShort = String(academicYearStart + 1).slice(-2);
  // Pad the count with 0s to make it 4 digits
  const paddedCount = String(count).padStart(4, "0");
  
  return `${startYearShort}/ULC/${paddedCount}/${endYearShort}`;
}

/**
 * Génère le matricule complet pour un professeur.
 * @param yearStart L'année de début (ex: 2025)
 * @param count L'incrément (ex: 5)
 * @returns ex: 25/ULC/PRF/005/26
 */
export function generateProfessorMatriculeString(yearStart: number, count: number): string {
  const startYearShort = String(yearStart).slice(-2);
  const endYearShort = String(yearStart + 1).slice(-2);
  const paddedCount = String(count).padStart(3, "0");
  
  return `${startYearShort}/ULC/PRF/${paddedCount}/${endYearShort}`;
}
