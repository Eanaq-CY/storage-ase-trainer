/* Stammdaten: Themen, Prüfungs-Blueprints, Quellen */
window.ASE = window.ASE || {};

ASE.topics = {
  grundlagen:      { name: "Speicherarchitekturen", icon: "🧱", desc: "Block, File, Object, DAS/NAS/SAN, SDS, HCI" },
  medien:          { name: "Laufwerke & RAID", icon: "💽", desc: "HDD/SSD/NVMe, TLC/QLC, RAID, Write Penalty" },
  san:             { name: "SAN & Host-Anbindung", icon: "🔌", desc: "FC, iSCSI, NVMe-oF, Topologien, Zoning, LUN-Masking" },
  effizienz:       { name: "Speicheroptimierung", icon: "📉", desc: "Thin Provisioning, Dedupe, Kompression, Tiering, QoS" },
  verfuegbarkeit:  { name: "Verfügbarkeit & Multi-Site", icon: "🌐", desc: "HA, Replikation, Peer Persistence, RPO/RTO" },
  backup:          { name: "Datensicherung (Theorie)", icon: "🛟", desc: "Backup-Arten, Snapshots, 3-2-1-1-0, Tape, Air Gap" },
  b10000:          { name: "Alletra MP B10000", icon: "🟩", desc: "Block (und File) Scale-out, ArcusOS, Garantien" },
  x10000:          { name: "Alletra MP X10000 & File", icon: "🗂️", desc: "Object (S3) und File für KI/Unstructured Data" },
  msa:             { name: "HPE MSA Gen7", icon: "🗄️", desc: "Entry-SAN, MSA-DP+, Tiering, Remote Snap" },
  legacy:          { name: "Vorgänger & Migration", icon: "🔁", desc: "3PAR, Primera, Nimble, Alletra 5000/6000/9000, Peer Motion" },
  storeonce:       { name: "StoreOnce & StoreEver", icon: "📼", desc: "Deduplizierung, Catalyst, Cloud Bank, LTO-Tape" },
  zerto:           { name: "Zerto & Backup/DR-Services", icon: "♻️", desc: "CDP, VPG, Journal, GreenLake Backup & Recovery" },
  sannetz:         { name: "HPE SAN-Switches", icon: "🔀", desc: "B-series, C-series, Directors, Fabric-Design" },
  greenlake:       { name: "GreenLake, DSCC & InfoSight", icon: "☁️", desc: "Cloud-Management, AIOps, Beschaffungsmodelle" },
  tools:           { name: "Tools & Ressourcen", icon: "🧰", desc: "SPOCK, Ninja Online, SAF, CloudPhysics, OCA" },
  services:        { name: "Services & Garantien", icon: "🛡️", desc: "Tech Care, Complete Care, Future-Ready/Timeless" },
  staerken:        { name: "Stärken & Chancen", icon: "💡", desc: "HPE-Stärken erkennen und positionieren" },
  sizing:          { name: "Kundenumgebung & Sizing", icon: "📐", desc: "Assessment, Workloads, Planung, Sizing, Validierung" },
  installation:    { name: "Installation", icon: "🔧", desc: "Hardware, Erstzugriff, Konfiguration, Host-Setup" },
  betrieb:         { name: "Administration & Betrieb", icon: "⚙️", desc: "Updates, Provisioning, Schutzrichtlinien, RBAC" },
  monitoring:      { name: "Monitoring & Telemetrie", icon: "📊", desc: "DSCC, InfoSight, Alerts, Logging, Reporting" },
  optimierung:     { name: "Optimierung", icon: "🚀", desc: "Verbesserungspotenziale, Tuning, Optimierungsplan" },
  troubleshooting: { name: "Troubleshooting", icon: "🩺", desc: "Root Cause, typische Fehler, Prävention" },
  sicherheit:      { name: "Sicherheit & Cyber-Resilienz", icon: "🔐", desc: "Verschlüsselung, Immutability, Ransomware, MFA" },
  trends:          { name: "IT-Trends & Cloud-Modelle", icon: "📈", desc: "KI, Container, Private Cloud, as-a-Service" }
};

/* Offizielle Prüfungs-Blueprints (Quelle: HPE Exam Preparation Guides) */
ASE.exams = {
  J82: {
    code: "HPE0-J82", name: "HPE Storage Architect", cert: "HPE ASE – Storage Architect",
    questions: 60, minutes: 90, pass: 63, langs: "Englisch, Japanisch, Koreanisch",
    rev: "Stand April 2026, Revision 4",
    url: "https://certification-learning.hpe.com/tr/datasheet/exam/HPE0-J82",
    types: ["Matching (Zuordnung)", "Multiple Choice (mehrere Antworten)", "Multiple Choice (eine Antwort)", "Point and Click"],
    desc: "Prüft Wissen und Erfahrung als Architekt für HPE-Storage-Plattformen: Sizing, Konfiguration, Optimierung und Upgrade von HPE-Storage-Lösungen sowie die Fähigkeit, Geschäftsanforderungen zu bewerten und eine passende Lösung zu entwerfen.",
    candidate: "HPE-Partner, Kunden und Mitarbeitende mit mindestens drei Jahren Erfahrung als Architekt (Design, Konfiguration, Upgrade von Storage- und Backup-Lösungen).",
    sections: [
      { pct: 15, name: "Grundlegende Speicherarchitekturen und -technologien unterscheiden und anwenden", topics: ["grundlagen", "medien", "san", "effizienz", "verfuegbarkeit", "backup"],
        obj: ["Speichertechnologien vergleichen", "Laufwerks-Interconnect-Technologien beschreiben und bewerten", "Transporttechnologien identifizieren", "Speicheroptimierungstechnologien identifizieren", "Methoden und Technologien für Multi-Site-Datenverfügbarkeit beschreiben", "SAN-Topologien beschreiben und charakterisieren", "Storage-Präsentation an Hosts beschreiben", "Standard-Datensicherungstechnologien beschreiben", "Methoden für Datenverfügbarkeit und Resilienz beschreiben"] },
      { pct: 33, name: "HPE-Storage-Architekturen und -Technologien beschreiben", topics: ["b10000", "x10000", "msa", "legacy", "storeonce", "zerto", "sannetz", "greenlake", "tools", "services", "sicherheit"],
        obj: ["HPE-Storage-Hardware/-Software beschreiben und vergleichen", "Chassis-basierte Storage-Networking-Angebote (Directors) beschreiben", "HPE-Storage-Services beschreiben", "Tools und Ressourcen beschreiben", "Beschaffungsoptionen beschreiben", "Die HPE-Storage-Lösung korrekt positionieren", "HPE-Services und Garantieangebote beschreiben"] },
      { pct: 2, name: "Stärken von HPE-Storage-Lösungen identifizieren", topics: ["staerken"],
        obj: ["Chancen erkennen, die sich aus den Stärken von HPE-Storage-Lösungen ergeben"] },
      { pct: 40, name: "Die Kundenumgebung bewerten", topics: ["sizing"],
        obj: ["Den digitalen Lebenszyklus des Kunden (aktuelle und künftige Anforderungen) bewerten", "Die Kundenumgebung analysieren (Assessment)", "Eine Storage-Lösung für typische Workloads planen", "Eine Storage-Lösung für typische Workloads dimensionieren (Sizing)", "Ein typisches Storage-Angebot validieren"] },
      { pct: 10, name: "Kundenchancen identifizieren", topics: ["optimierung", "monitoring", "troubleshooting", "betrieb"],
        obj: ["Verbesserungsmöglichkeiten identifizieren", "Optionen für Verbesserungen bestimmen", "Einen Optimierungsplan entwickeln", "Geeignete präventive Maßnahmen umsetzen", "Datenschutz- und Replikationsrichtlinien konfigurieren", "Mit HPE-Cloud-Management/On-Prem-Tools Kunden-Telemetrie auswerten"] }
    ]
  },
  J83: {
    code: "HPE0-J83", name: "HPE Storage Integrator Solutions", cert: "HPE ASE – Storage Integrator Solutions",
    questions: 60, minutes: 90, pass: 63, langs: "Englisch, Japanisch, Koreanisch",
    rev: "Stand November 2025, Revision 3",
    url: "https://certification-learning.hpe.com/tr/datasheet/exam/HPE0-J83",
    types: ["Multiple Choice (mehrere Antworten), szenariobasiert", "Multiple Choice (eine Antwort), szenariobasiert", "Matching (Zuordnung)", "Multiple Choice (eine Antwort)", "Point and Click"],
    desc: "Prüft Wissen und Erfahrung als Integrator für HPE-Storage: Sizing, Design, Installation, Konfiguration, Optimierung, Upgrade, Management, Monitoring, Troubleshooting und Wartung von HPE-Storage-Lösungen.",
    candidate: "HPE-Partner, Kunden und Mitarbeitende mit mindestens drei Jahren Integrationserfahrung (Design, Installation, Konfiguration, Management von Storage- und Backup-Lösungen).",
    sections: [
      { pct: 13, name: "Grundlegende Speicherarchitekturen und -technologien", topics: ["grundlagen", "medien", "san", "effizienz", "verfuegbarkeit", "backup"],
        obj: ["Speichertechnologien vergleichen (File, Block, Object)", "Use Cases für Laufwerkstechnologien und RAID-Level beschreiben", "SAN-Transporttechnologien und Komponenten beschreiben", "Speicheroptimierungstechnologien identifizieren", "Multi-Site-Datenverfügbarkeit beschreiben", "SAN-Topologien, Transporttechnologien und Komponenten charakterisieren", "Storage-Präsentation an Hosts (LUN-Masking, SSP, software-basiertes Zoning usw.)", "Standard-Datensicherungstechnologien beschreiben", "Datenverfügbarkeit und Resilienz beschreiben"] },
      { pct: 17, name: "Funktionen und Fähigkeiten von HPE-Storage-Produkten, -Lösungen und Garantieleistungen", topics: ["b10000", "x10000", "msa", "legacy", "storeonce", "zerto", "sannetz", "greenlake", "tools", "services", "sicherheit"],
        obj: ["Das HPE-Storage-Portfolio beschreiben", "HPE-Storage-Hardware/-Software beschreiben und vergleichen", "Chassis-basierte Storage-Networking-Angebote beschreiben", "HPE-Storage-Services beschreiben", "HPE-Storage-Tools und -Ressourcen beschreiben", "HPE-Storage-Sicherheitskonzepte beschreiben", "HPE-Storage-Lösungen positionieren", "Passende HPE-Ressourcen für Kundenanforderungen identifizieren", "HPE-Services und Garantieangebote beschreiben"] },
      { pct: 9, name: "HPE-Storage-Lösungen planen und designen", topics: ["staerken"],
        obj: ["Stärken von HPE-Storage-Lösungen identifizieren", "Chancen aus diesen Stärken erkennen"] },
      { pct: 18, name: "IT-Trends, Standardarchitekturen, Technologien und Cloud-Bereitstellungsmodelle", topics: ["sizing", "trends"],
        obj: ["Eine Storage-Lösung für typische Workloads planen", "Eine Storage-Lösung für typische Workloads dimensionieren"] },
      { pct: 13, name: "Die Lösung installieren", topics: ["installation"],
        obj: ["Storage-Hardware installieren", "Auf das Storage-System zugreifen", "Passende Konfiguration und Systemeinstellungen anwenden", "Die Systemkonfiguration abschließen"] },
      { pct: 7, name: "Eine bestehende HPE-Storage-Lösung performance-tunen und optimieren", topics: ["optimierung"],
        obj: ["Verbesserungsmöglichkeiten identifizieren", "Optionen für Verbesserungen bestimmen", "Einen Optimierungsplan entwickeln"] },
      { pct: 7, name: "Typische Storage-Fehler troubleshooten", topics: ["troubleshooting"],
        obj: ["Root Cause von Problemen identifizieren", "Präventive Maßnahmen umsetzen"] },
      { pct: 10, name: "HPE-Storage-Lösungen administrieren und betreiben", topics: ["betrieb", "sicherheit"],
        obj: ["Regelmäßige Software- und Firmware-Updates durchführen", "Storage-Zugriff konfigurieren", "Kapazität provisionieren", "Datenschutz- und Replikationsrichtlinien konfigurieren", "Integrität von Datensicherung und Disaster Recovery testen", "RBAC konfigurieren", "Lifecycle-Datenmanagement umsetzen"] },
      { pct: 6, name: "HPE-Storage-Lösungen überwachen", topics: ["monitoring"],
        obj: ["Mit HPE-Cloud-Management und/oder On-Prem-Tools Telemetrie auswerten", "Alerts, Logging und Reporting konfigurieren"] }
    ]
  },
  J81: {
    code: "HPE0-J81", name: "HPE Storage Fundamentals", cert: "HPE ATP – Storage Solutions (Vorstufe zum ASE)",
    questions: 50, minutes: 90, pass: 70, langs: "Englisch, Japanisch",
    rev: "Stand November 2025, Revision 2",
    url: "https://certification-learning.hpe.com/tr/datasheet/exam/HPE0-J81",
    types: ["Multiple Choice (mehrere Antworten), szenariobasiert", "Multiple Choice (eine Antwort)"],
    desc: "Grundlagenprüfung zu HPE-Storage-Plattformen. Optional als Aufwärmübung vor dem ASE.",
    candidate: "Mindestens ein Jahr Erfahrung mit HPE-Storage- und Backup-Lösungen.",
    sections: [
      { pct: 24, name: "HPE-Storage-Produkte und Tools identifizieren", topics: ["greenlake", "tools", "b10000", "legacy"], obj: ["Kundenanforderungen bewerten", "HPE-GreenLake-Grundlagen", "HPE-Storage-Portfolio", "Tools und Ressourcen finden und nutzen"] },
      { pct: 23, name: "HPE-Storage-Lösungen vergleichen", topics: ["grundlagen", "greenlake", "x10000"], obj: ["DAS, NAS, SAN unterscheiden", "File, Block, Object, Converged, SDS unterscheiden", "HPE-GreenLake-Angebote beschreiben"] },
      { pct: 14, name: "HPE-MSA-Storage-Lösungen", topics: ["msa"], obj: ["Funktionen, Hardware und Software der MSA"] },
      { pct: 17, name: "HPE Alletra Storage", topics: ["b10000", "x10000"], obj: ["B10000 und X10000 beschreiben", "Alletra-MP-Hardware erklären", "Alletra-MP-Arrays verwalten"] },
      { pct: 22, name: "Datensicherung: Theorie und Lösungen", topics: ["backup", "storeonce", "zerto"], obj: ["Datensicherungstheorie und Definitionen", "HPE StoreOnce", "HPE StoreEver Tape", "HPE Zerto"] }
    ]
  }
};

/* Offizielle Quellen (für "Offizielle Erklärung"-Hinweise) */
ASE.sources = {
  j82: { t: "HPE Exam Preparation Guide HPE0-J82 (Storage Architect)", u: "https://certification-learning.hpe.com/tr/datasheet/exam/HPE0-J82" },
  j83: { t: "HPE Exam Preparation Guide HPE0-J83 (Storage Integrator Solutions)", u: "https://certification-learning.hpe.com/tr/datasheet/exam/HPE0-J83" },
  j81: { t: "HPE Exam Preparation Guide HPE0-J81 (Storage Fundamentals)", u: "https://certification-learning.hpe.com/tr/datasheet/exam/HPE0-J81" },
  b10qs: { t: "HPE QuickSpecs: HPE Alletra Storage MP B10000", u: "https://www.hpe.com/us/en/greenlake/block-storage-service.html" },
  b10top: { t: "HPE Brochure: Top 12 reasons to choose HPE Alletra Storage MP B10000", u: "https://www.hpe.com/psnow/doc/a50009484enw" },
  futureready: { t: "HPE Storage Future-Ready Program", u: "https://www.hpe.com/us/en/storage/future-ready-program" },
  pr2505: { t: "HPE Pressemitteilung Mai 2025: Cyber-Resilienz und Datenverfügbarkeit für Alletra Storage MP", u: "https://www.hpe.com/us/en/newsroom/press-release/2025/05/hewlett-packard-enterprise-strengthens-cyber-resiliency-and-data-availability-for-hpe-alletra-storage-mp-customers.html" },
  pr2605: { t: "HPE Pressemitteilung Mai 2026: Unified Private Clouds und Datenplattformen", u: "https://www.hpe.com/us/en/newsroom/press-release/2026/05/hpe-delivers-unified-private-clouds-and-data-platforms-to-accelerate-enterprise-modernization-and-ai-data-readiness.html" },
  x10k: { t: "HPE Alletra Storage MP X10000 (Produktseite)", u: "https://www.hpe.com/us/en/alletra-storage-mp-x10000.html" },
  msaqs: { t: "HPE QuickSpecs: HPE MSA Gen7 Storage", u: "https://www.hpe.com/psnow/doc/a50009222enw" },
  storeonce: { t: "HPE StoreOnce Systems QuickSpecs", u: "https://www.hpe.com/us/en/collaterals/collateral.c04328820.html" },
  storeever: { t: "HPE StoreEver Tape Storage", u: "https://www.hpe.com/us/en/storage/storeever-tape-storage.html" },
  zerto: { t: "HPE Zerto Software", u: "https://www.hpe.com/us/en/zerto.html" },
  glbr: { t: "HPE GreenLake for Backup and Recovery – Developer Guide", u: "https://developer.greenlake.hpe.com/docs/greenlake/services/backup-recovery/public/guide" },
  pp: { t: "HPE Peer Persistence – Overview", u: "https://www.hpe.com/psnow/resources/ebooks/a00114824en_us_v2/peer_persistence_about.html" },
  spock: { t: "HPE SPOCK – Single Point of Connectivity Knowledge", u: "https://www.hpe.com/storage/spock" },
  cloudphysics: { t: "HPE CloudPhysics", u: "https://www.hpe.com/storage/cloudphysics" },
  saf: { t: "HPE Assessment Foundry (SAF)", u: "https://saf.hpe.com" },
  techcare: { t: "HPE Tech Care Service", u: "https://www.hpe.com/services/techcare" },
  completecare: { t: "HPE Complete Care Service", u: "https://www.hpe.com/services/completecare" },
  sandirector: { t: "HPE Storage SAN Director Switch QuickSpecs", u: "https://www.hpe.com/us/en/collaterals/collateral.c04154441.html" },
  storage: { t: "HPE Storage – Portfolio-Übersicht", u: "https://www.hpe.com/us/en/storage.html" }
};
