import Image from "next/image";
import styles from "./brand-loader.module.css";

const cubePieces = [styles.cubeTopLeft, styles.cubeTopRight, styles.cubeBottomLeft, styles.cubeBottomRight];

export function BrandLoader({ label = "Chargement de Studio ATS" }: { label?: string }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite" aria-label={label}>
      <div className={styles.mark} aria-hidden="true">
        <div className={styles.sLetter}>
          <Image src="/brand/studio-s.png" alt="" fill sizes="(max-width: 640px) 144px, 184px" preload />
        </div>
        {cubePieces.map((piece) => (
          <div className={`${styles.cubePiece} ${piece}`} key={piece}>
            <Image src="/brand/studio-cube.png" alt="" fill sizes="(max-width: 640px) 144px, 184px" preload />
          </div>
        ))}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
