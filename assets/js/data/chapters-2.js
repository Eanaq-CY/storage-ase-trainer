/* Lernkapitel Teil 2: Datensicherung mit HPE, Netzwerk, Cloud, Services, Sizing, Betrieb */
window.ASE = window.ASE || {};
ASE.chapters = ASE.chapters || [];
ASE.chapters.push(
{id:"k12",title:"HPE StoreOnce und StoreEver",topics:["storeonce"],min:14,
intro:"Deduplizierende Backup-Appliances, Catalyst, Cloud Bank, Sicherheit und Tape.",
html:`
<div class="callout official"><b>Offiziell (HPE StoreOnce QuickSpecs V62, Oktober 2026, sinngemäß):</b> StoreOnce sind deduplizierende, cloud-integrierte Backup-Systeme mit feingranularen 4-KB-Chunks; Backupdaten lassen sich um 95 % oder mehr reduzieren, Backups laufen mit bis zu 300 TB/h. Catalyst bietet höhere Performance, verbesserte Sicherheit und flexiblere Steuerung als VTL oder NFS/SMB-Shares. <a href="https://www.hpe.com/psnow/doc/c04328820" target="_blank" rel="noopener">Quelle</a></div>
<h3>Modelle</h3>
<table><thead><tr><th>Generation</th><th>Modell</th><th>Einsatz</th><th>Nutzbar</th><th>Catalyst max.</th></tr></thead><tbody>
<tr><td rowspan="4">Gen5</td><td>3720</td><td>Klein/Zweigstelle</td><td>18–72 TB</td><td>15 TB/h</td></tr>
<tr><td>3760</td><td>Mid-Range</td><td>108–216 TB</td><td>25 TB/h</td></tr>
<tr><td>5720</td><td>Large/Enterprise</td><td>144–576 TB</td><td>70 TB/h</td></tr>
<tr><td>7700</td><td>All-Flash, schnellste Restores</td><td>92–552 TB</td><td>300 TB/h</td></tr>
<tr><td rowspan="3">Gen4 Plus</td><td>3660</td><td>Klein/Zweigstelle</td><td>56–200 TB</td><td>25 TB/h</td></tr>
<tr><td>5260</td><td>Mid-Range</td><td>144–576 TB</td><td>60 TB/h</td></tr>
<tr><td>5660</td><td>Enterprise</td><td>144–1.152 TB</td><td>105 TB/h</td></tr>
</tbody></table>
<p>Dazu die <b>StoreOnce VSA</b> (virtuelle Appliance, gleiche Konsole). Sizing mit dem <b>HPE StoreOnce Sizer</b>. Garantie: 3 Jahre Teile, Arbeit, Vor-Ort (NBD).</p>
<h3>Zieltypen und Catalyst</h3>
<ul>
<li>Zieltypen: <b>Catalyst</b>, <b>VTL</b>, <b>NFS</b>, <b>SMB</b>.</li>
<li><b>Low Bandwidth</b> = quellseitige Deduplizierung (nur Neues übers Netz, ideal für WAN/viele Streams); <b>High Bandwidth</b> = zielseitig.</li>
<li><b>Catalyst Copy</b> – deduplizierte Replikation zwischen StoreOnce-Systemen (Multi-Hop, n:1), auch über FC (CCoFC); Backup über FC = CoFC.</li>
<li><b>Fixed Block Chunking</b> (z. B. Veeam ab StoreOnce 4.3.2): nur beim Anlegen des Stores wählbar, nur mit Low Bandwidth; in Veeam „Align backup file data blocks“ aktivieren; deutlich schneller als variables Chunking.</li>
<li><b>Federation</b>: bis zu 40 Systeme über die GUI des Lead-Systems verwalten.</li>
<li><b>Integrated Protection</b>: Gen5-Systeme an GreenLake angebunden → Backup-Ziel in B10000-Protection-Policies (Block Storage).</li>
</ul>
<h3>Cloud Bank Storage</h3>
<p>Erweitert die Kapazität dedupliziert um Object Storage (on-prem oder Public Cloud); Ziel für Catalyst Copy. Mit <b>Detach</b> wird ein Store read-only abgetrennt und kann in ein günstiges Cold Tier verschoben werden.</p>
<h3>Sicherheit</h3>
<ul>
<li><b>Data at Rest</b>: softwarebasiert, nach der Deduplizierung, pro Store, AES-256, lokales Key-Management inklusive.</li>
<li><b>Data in Flight</b>: IPsec – nur für Catalyst (Backup Low BW, Catalyst Copy, Replikation); nicht empfohlen bei häufigen Restores/Tape-Offload.</li>
<li><b>Secure Erase</b> nach NIST SP 800-88; <b>Immutability</b> (ISV-gesteuert, nicht verkürzbar).</li>
<li><b>Dual Authorization</b>: destruktive Aktionen brauchen die Freigabe eines Security Officers; zusätzlich MFA für lokale Benutzer.</li>
</ul>
<h3>Betrieb</h3>
<ul>
<li><b>Housekeeping</b> gibt Speicher nach Ablauf von Backups frei; <b>Blackout Windows</b> halten es aus Backup-Fenstern heraus – es muss aber genug Zeit bekommen, sonst bleibt der Platz belegt.</li>
<li>Kein Multiplexing in der Backup-Software, stattdessen parallele Streams; große Blockgrößen (z. B. 256 KB).</li>
</ul>
<h3>StoreEver (Tape)</h3>
<ul>
<li>LTO-Laufwerke, Autoloader, MSL-Libraries (z. B. MSL3040, MSL6480); Verwaltung mit <b>Command View for Tape Libraries (CVTL)</b>.</li>
<li><b>Data Verification</b> (lizenziert, MSL3040/MSL6480): DV-Partition prüft Kassetten im Hintergrund und warnt proaktiv.</li>
<li><b>MSL Vault Partition</b> (MSL3040): laufwerksfreier, für Hosts unsichtbarer Bereich – Air Gap in der Library.</li>
</ul>`},

{id:"k13",title:"Zerto, Backup- und DR-Services",topics:["zerto"],min:10,
intro:"Continuous Data Protection mit Zerto, GreenLake for Backup and Recovery und Disaster Recovery as a Service.",
html:`
<h3>HPE Zerto</h3>
<ul>
<li><b>Hypervisor-basierte CDP</b>: jeder Write wird erfasst, unabhängig von der Speicherhardware → hybrid und multicloud.</li>
<li><b>VRA</b> (Virtual Replication Appliance) je Host, <b>ZVM</b> (Zerto Virtual Manager) je Standort, <b>VPG</b> (Virtual Protection Group) = konsistent geschützte VM-Gruppe.</li>
<li><b>Journal</b> mit Checkpoints im Sekundenabstand (Historie bis 30 Tage) → RPO Sekunden, RTO Minuten; <b>Long-Term Retention</b> für Monate/Jahre.</li>
<li><b>Failover Test</b> ohne Unterbrechung in isoliertem Netz; Move/Migration (auch VMware → HPE VM Essentials).</li>
<li><b>Zerto 10</b>: Echtzeit-Erkennung verdächtiger Verschlüsselung, <b>Cyber Resilience Vault</b> (isoliert, Zero Trust, unveränderbare Kopien).</li>
<li>2026: KI-Assistent, Microsoft-Defender-Integration, Live-Migration aus VMware mit CDP.</li>
</ul>
<h3>HPE GreenLake for Backup and Recovery</h3>
<ul>
<li>SaaS-Backup, gesteuert aus der GreenLake-Konsole; <b>Protection Store Gateway</b> (On-Prem-VM, Catalyst-Engine: Dedupe, Kompression, Verschlüsselung).</li>
<li>Protection Policies kombinieren <b>Snapshots → lokales Backup (Protection Store/StoreOnce) → Cloud-Backup (HPE Cloud Protection Store)</b>, optional unveränderbar.</li>
</ul>
<h3>HPE GreenLake for Disaster Recovery</h3>
<p>Zerto-basierter DR-Service, bereitgestellt und verwaltet über HPE GreenLake.</p>
<h3>Veeam mit HPE</h3>
<ul>
<li>Veeam kann aus Array-Snapshots wiederherstellen, auch wenn sie außerhalb von Veeam erstellt wurden (Veeam Explorer for Storage Snapshots).</li>
<li>Backup from Storage Snapshots über FC: Proxy braucht physischen FC-Zugang, sonst Fallback auf den Network Mode.</li>
<li>StoreOnce Catalyst als Repository (Immutability ab 4.3.2, Fixed Block Chunking).</li>
</ul>`},

{id:"k14",title:"HPE Storage Networking",topics:["sannetz"],min:7,
intro:"B-series und C-series, Directors, SANnav, Trunking und Diagnose.",
html:`
<ul>
<li><b>B-series</b> = Brocade/Broadcom, Fabric OS. Management mit <b>SANnav</b> (zentral, inkl. Zoning und Monitoring/Fabric Vision).</li>
<li><b>C-series</b> = Cisco MDS, NX-OS, <b>VSANs</b> (logisch getrennte Fabrics; bei Brocade „Virtual Fabrics“).</li>
<li><b>Chassis-based offerings = Directors</b>: modulare Blades, redundante Control- und Core-Blades, Netzteile, Lüfter. Beispiel <b>SN8700B</b>: 64 Gb (Gen 7), 256 Ports (4-Slot) bzw. 512 Ports (8-Slot); Upgrade von SN8600B über Core-Blades.</li>
<li><b>ISL Trunking</b>: bis 8 ISLs pro Trunk, gleiche Portgruppe und Geschwindigkeit, Frame-Lastverteilung, Lizenz für ISL-Trunking.</li>
<li><b>D_Port/ClearLink</b>: Diagnose von Link, Optiken und Kabeln vor Produktivnahme.</li>
<li><b>HPE Smart SAN</b>: Target-Driven Peer Zoning durch das Array.</li>
<li>Referenz: <b>HPE SAN Design Reference Guide</b>.</li>
</ul>
<div class="callout remember"><b>Merke:</b> Die 100GbE-Switches einer switched B10000 sind <b>keine</b> SAN-Switches – sie verbinden nur Controller und JBOFs.</div>`},

{id:"k15",title:"HPE GreenLake, DSCC, InfoSight und Beschaffung",topics:["greenlake"],min:12,
intro:"Cloud-Management für Storage, AIOps, Rollen und Beschaffungsmodelle.",
html:`
<h3>Data Services Cloud Console (DSCC)</h3>
<p>SaaS-Anwendung in HPE GreenLake mit Service-Kacheln. Für die B10000 gilt laut Architektur-Whitepaper:</p>
<table><thead><tr><th>Service</th><th>Aufgaben</th></tr></thead><tbody>
<tr><td><b>Setup Service</b></td><td>Ersteinrichtung (Hardware-Bereitschaft, Stromredundanz, Verkabelung, Komponentenzustand); <b>Blueprints</b> für DNS, NTP, Support-Kontakt auf viele Systeme</td></tr>
<tr><td><b>Data Ops Manager</b></td><td>Infrastruktur: Inventar, Zustand, Kapazität, Performance, Netzwerk-/Systemeinstellungen, Support-Bundles; <b>Hosts und Hostgruppen</b>; Replikationspartner; Hardware-Service; Software-Updates; Resource Contention Insights</td></tr>
<tr><td><b>Block Storage</b></td><td>Daten: Volumes erstellen/ändern/löschen, Volume Sets, <b>Protection Policies anwenden</b>, Kapazität/Performance je Volume Set, intent-basierte Provisionierung</td></tr>
</tbody></table>
<h3>Data Ops Manager – Analysen</h3>
<ul>
<li>Performance-Tab: Default, <b>Predefined Reports</b> (z. B. Top volume paths by read latency, Top volume sets by read IOPS, Top host ports by write throughput) und Custom Charts.</li>
<li><b>Latency Insights</b>: Faktoren CPU-Auslastung, Disk Busy, Read-Cache-Miss (5-Minuten-Mittel, Insights auf hochauflösenden Daten).</li>
<li>Headroom, Top-Volume-/Volume-Set-Hotspots, Workload-Drift, Resource Contention, Nachhaltigkeit (CO₂, Energie).</li>
<li>Software-Updates: verfügbare Updates je System, Readiness Checks (auch für viele Systeme), <b>One-Step-Updates</b> (Call Home nötig).</li>
</ul>
<h3>HPE InfoSight und AIOps</h3>
<p>Telemetrie der installierten Basis, Vorhersage und Vermeidung von Problemen, Cross-Stack-Analysen; bei der B10000 über DSCC/Data Ops Manager, ab Release 6 ergänzt um agentische Support-Automatisierung.</p>
<h3>Rollen in HPE GreenLake</h3>
<p>Administrator (anzeigen, ändern, löschen) · Operator (anzeigen, ändern) · <b>Observer (nur anzeigen)</b>. Benutzer einladen erfordert Workspace Administrator.</p>
<h3>Beschaffungsmodelle</h3>
<ul>
<li><b>Kauf (CapEx)</b> – Einmalinvestition.</li>
<li><b>HPE Financial Services</b> – Leasing/Finanzierung, Rücknahme.</li>
<li><b>HPE GreenLake Flex</b> – nutzungsbasiert (metered) mit Puffer vor Ort, schnelle Erweiterung.</li>
<li><b>Subscription</b> – z. B. B10000 Software and Support SaaS pro TB und Laufzeit.</li>
</ul>
<h3>Private Cloud</h3>
<p><b>HPE Private Cloud Business Edition</b>: Self-Service-Private-Cloud mit ProLiant + B10000 (bzw. SimpliVity). 2026: <b>HPE Private Cloud</b> 4. Generation mit ProLiant Gen12 und Kubernetes.</p>`},

{id:"k16",title:"Tools und Ressourcen",topics:["tools"],min:7,
intro:"Welche HPE-Werkzeuge der Architekt wann nutzt.",
html:`
<table><thead><tr><th>Werkzeug</th><th>Zweck</th></tr></thead><tbody>
<tr><td><b>HPE Assessment Foundry (SAF)</b></td><td>Daten sammeln: Konfiguration/Performance von Arrays (auch Fremdhersteller), Servern, VMware/Hyper-V</td></tr>
<tr><td><b>HPE CloudPhysics</b></td><td>Kostenloses SaaS-Assessment für VMware: Observer je vCenter, Read-only-API, Port 443</td></tr>
<tr><td><b>Ninja Online / NinjaSTARS</b></td><td>Performance- und Kapazitäts-Sizing (B10000 inkl. QLC-Eignung, Primera, Nimble, StoreOnce)</td></tr>
<tr><td><b>HPE StoreOnce Sizer</b></td><td>StoreOnce-Dimensionierung</td></tr>
<tr><td><b>SPOCK</b></td><td>Kompatibilität: OS, HBA, Treiber, Switch-Firmware, Multipathing, Replikations-Interop</td></tr>
<tr><td><b>OCA</b></td><td>Konfigurieren und Angebot erstellen (inkl. Self-Install-Option)</td></tr>
<tr><td><b>PSNow</b></td><td>QuickSpecs, Datenblätter, Whitepaper – nach Land/Sprache</td></tr>
<tr><td><b>HPE Support Center</b></td><td>Dokumentation, Firmware, Support-Fälle</td></tr>
<tr><td><b>MSA Health Check</b></td><td>MSA-Logs auf Best Practices und Firmware prüfen</td></tr>
<tr><td><b>Storage Integration Pack for vCenter</b></td><td>Storage-Sicht und Datastore-Verwaltung im vCenter</td></tr>
<tr><td><b>SAN Design Reference Guide</b></td><td>Regeln für SAN-Design und Interoperabilität</td></tr>
<tr><td><b>System Reporter / CLI</b></td><td>statvlun (Echtzeit, exportierte Volumes inkl. Service Time), statvv, srstat* (Historie), createsralertcrit (Performance-Alerts)</td></tr>
</tbody></table>
<div class="callout tip"><b>Reihenfolge im Projekt:</b> Daten sammeln (SAF/CloudPhysics) → sizen (Ninja/StoreOnce Sizer) → Kompatibilität (SPOCK) → konfigurieren und anbieten (OCA) → Details in QuickSpecs (PSNow).</div>`},

{id:"k17",title:"Services, Support und Garantien",topics:["services"],min:8,
intro:"Tech Care, Complete Care, Lifecycle-Services, Gewährleistung und das Future-Ready Program.",
html:`
<h3>Support</h3>
<ul>
<li><b>HPE Tech Care</b>: Basic (Geschäftszeiten, NBD-Teile), Essential (24x7, 4-Stunden-Teiletausch wo verfügbar), Critical (6-Stunden-Call-to-Repair bei Severity 1/2, Outage Management). Alle Stufen mit Zugang zu Produktexperten.</li>
<li><b>HPE Complete Care</b>: modular, edge-to-cloud, zugewiesenes HPE-Team, ergebnisorientiert.</li>
<li><b>Defective Media Retention</b>: defekte Datenträger bleiben beim Kunden.</li>
<li><b>Lifecycle Services</b>: Installation & Startup, Firmware Update Analysis/Implementation, Implementierungsunterstützung, Service Credits; <b>Data Migration Services</b>.</li>
</ul>
<h3>Gewährleistung</h3>
<table><thead><tr><th>Produkt</th><th>Standard</th></tr></thead><tbody>
<tr><td>B10000</td><td>1 Jahr nur Teile; SSDs inkl. Verschleißersatz; Software-Medien 90 Tage</td></tr>
<tr><td>StoreOnce (Gen5/Gen4 Plus)</td><td>3 Jahre Teile, Arbeit, Vor-Ort (NBD)</td></tr>
<tr><td>MSA-Laufwerke</td><td>SSDs und 10K-HDDs 3 Jahre, 7.2K-Midline 1 Jahr (laut SKU); Software-Support nur über Tech Care</td></tr>
</tbody></table>
<h3>HPE Storage Future-Ready Program (B10000)</h3>
<ul>
<li><b>100 % Data Availability Guarantee</b> – „cost-nothing, do-nothing“, Gutschrift bei Nichterfüllung (gültiger Support vorausgesetzt).</li>
<li><b>StoreMore</b> – mindestens 4:1 Datenreduktion (ab Release 6 laut HPE 5:1).</li>
<li><b>Controller-Refresh</b> (Timeless) – nicht-disruptiv, ohne Datenmigration.</li>
<li><b>Satisfaction</b> – 30 Tage.</li>
<li><b>Cyber Resiliency</b> – HPE-Experte in 30 Minuten nach Ransomware-Meldung, Zugriff auf unveränderbare Snapshots (OS 10.5, mind. 3 Jahre SaaS).</li>
<li><b>Energy Consumption</b> – monatlicher Verbrauch unter vereinbartem Maximum, sonst Gutschein (Tech Care/Complete Care).</li>
<li><b>Zero RTO/RPO</b> – mit Active Peer Persistence, identischen Arrays, mind. 3 Jahre SaaS.</li>
</ul>`},

{id:"k18",title:"Kundenumgebung bewerten und Sizing",topics:["sizing"],min:18,
intro:"Der größte Prüfungsteil bei HPE0-J82 (40 %): Assessment, Workloads, Formeln, Planung und Validierung.",
html:`
<h3>Vorgehen</h3>
<ol>
<li><b>Digitalen Lebenszyklus verstehen</b>: heutige und künftige Anforderungen (3–5 Jahre), Wachstum, neue Workloads, Betriebsmodell.</li>
<li><b>Assessment</b>: Daten erheben (SAF, CloudPhysics, InfoSight/System Reporter) über einen vollen Geschäftszyklus – <b>Spitzen</b> (z. B. 95. Perzentil), nicht Durchschnitt.</li>
<li><b>Planen</b>: Workload-Profil → Plattform, Medium, Schutzkonzept (RPO/RTO aus BIA).</li>
<li><b>Sizen</b>: Kapazität (inkl. Wachstum, Snapshots, Datenreduktion) und Performance (IOPS, Durchsatz, Latenz, Headroom, Fehlerfall).</li>
<li><b>Validieren</b>: SPOCK, Sizing-Tool-Ergebnis, Rack/Strom/Kühlung, Lizenzen, Support, Migration.</li>
</ol>
<h3>Workload-Profile</h3>
<table><thead><tr><th>Workload</th><th>Profil</th><th>Metrik</th></tr></thead><tbody>
<tr><td>OLTP-Datenbank</td><td>klein (4–16 KB), zufällig, leselastig</td><td>IOPS, Latenz</td></tr>
<tr><td>Data Warehouse/Analytics</td><td>groß, sequentiell lesend</td><td>Durchsatz</td></tr>
<tr><td>VDI</td><td>klein, zufällig, schreiblastig; Boot-/Login-Stürme</td><td>IOPS, Latenz; hohe Dedupe</td></tr>
<tr><td>Backup-Ziel</td><td>groß, sequentiell schreibend</td><td>Durchsatz (TB/h)</td></tr>
<tr><td>KI-Training</td><td>groß, parallel lesend</td><td>Durchsatz, GPU-Auslastung</td></tr>
</tbody></table>
<h3>Formeln</h3>
<div class="formula">Durchsatz = IOPS × Blockgröße<br>Back-end-IOPS = Lese-IOPS + Schreib-IOPS × Write Penalty (RAID 10 = 2, RAID 5 = 4, RAID 6 = 6)<br>Laufwerke (HDD) = Back-end-IOPS ÷ IOPS je Laufwerk<br>Kapazität in n Jahren = heute × (1 + Wachstum)<sup>n</sup><br>Effektiv = Nutzbar × Datenreduktion · Nutzbar = Effektiv ÷ Datenreduktion<br>Snapshot-Reserve = Änderungsrate/Tag × Daten × Aufbewahrungstage<br>Replikationsbandbreite = Änderungsmenge ÷ Zeitfenster (+20–30 % Overhead)<br>Ausstehende I/Os = IOPS × Latenz (Little's Law)<br>1 TiB = 1,0995 TB</div>
<h3>Typische Entscheidungen</h3>
<ul>
<li>RPO 0 + Metro → synchron/Peer Persistence; RPO Minuten + große Distanz → asynchron; heterogen/VMs/Cloud → Zerto.</li>
<li>Leselastig, große Kapazität → QLC prüfen; schreibintensiv → TLC.</li>
<li>Verschlüsselte/vorkomprimierte Daten → Datenreduktion ~1:1.</li>
<li>Headroom: Wachstum, Spitzen und Fehlerfall (N−1) einplanen; Planungsgrenze z. B. 80–90 % Auslastung.</li>
<li>Backup-Fenster: benötigter Durchsatz = Datenmenge ÷ Fenster → passende StoreOnce-Klasse.</li>
</ul>
<div class="callout tip"><b>Prüfungstipp:</b> Szenariofragen enthalten oft überflüssige Zahlen (z. B. Anzahl der Snapshots). Erst die Formel wählen, dann nur die relevanten Werte einsetzen.</div>`},

{id:"k19",title:"Installation, Konfiguration und Betrieb",topics:["installation","betrieb"],min:12,
intro:"Von der Montage bis zur täglichen Administration – Schwerpunkte des Integrator-Examens (J83).",
html:`
<h3>Installation B10000</h3>
<ul>
<li>Vorbereitung: Rack (HPE empfiehlt 1200 mm tief, 3-phasig), zwei Netzteile pro Chassis (C14 1600 W Platinum bzw. 2200 W Titanium für EU Lot 9 – nur High-Line; C20 1500 W nur Low-Line; DC-Option).</li>
<li>Kunde stellt sicher: Host/SAN laut SPOCK unterstützt, Best Practices erfüllt, bestehende Probleme behoben.</li>
<li>Verkabelung: Backend switchless per DAC, switched per AOC zu zwei 100GbE-Switches; FC-Hosts mit OM4, jeder Knoten in <b>beide Fabrics</b>.</li>
<li>Laufwerke ab Slot 1 lückenlos, Shelves ausgewogen.</li>
<li>Einrichtung: einbauen, Strom und Netz anschließen → <b>DSCC Setup Service</b> (Prüfung von Hardware, Stromredundanz, Verkabelung) → Blueprint (DNS, NTP, Support-Kontakt).</li>
<li>Selbstinstallation (B10100) setzt SAN-/FC-, TCP/IP- (DNS/NTP) und LUN-Erfahrung voraus.</li>
</ul>
<h3>Installation MSA Gen7</h3>
<p>Erstzugang über den Management-Port (SMU v4 per HTTPS, CLI per SSH) bzw. USB-CLI; Netzwerk, Benutzer, Zeit, Benachrichtigungen setzen; Disk Groups/Pools (MSA-DP+), Volumes, Hosts und Mapping; Volumes auf beide Pools verteilen.</p>
<h3>Host-Anbindung</h3>
<ul>
<li>HBA-Treiber/Firmware laut SPOCK; Zoning (Single Initiator) auf den Switches.</li>
<li>Windows: Feature <b>MPIO</b> + passendes <b>DSM</b>; Linux: DM-Multipath laut HPE-Implementation-Guide; VMware: Round Robin.</li>
<li>Host in Data Ops Manager mit <b>Betriebssystem und Initiatoren</b> anlegen, Hostgruppe, Volumes/Volume Sets exportieren, Rescan.</li>
<li>iSCSI: Ports/VLANs/Subnetze, konsistente MTU, Discovery, CHAP optional.</li>
<li>VM Essentials: Volume allen Knoten präsentieren und als <b>GFS2</b>-Datastore anlegen (empfohlen ab 3 Knoten; 2-Knoten-Cluster mit NFS).</li>
</ul>
<h3>Administration</h3>
<ul>
<li><b>Updates</b>: Data Ops Manager (Readiness Checks, One-Step-Updates, Call Home); MSA online per Smart Components mit Multipathing.</li>
<li><b>Provisionierung</b>: Thin Volumes (max. 64 TiB je VV), Volume Sets, intent-basiert in Block Storage.</li>
<li><b>Schutz</b>: Protection Policies (Snapshots, Replikation, Backup auf StoreOnce), Remote-Copy-Gruppen, Zerto-VPGs.</li>
<li><b>DR testen</b>: Zerto Failover Test, Peer-Persistence-Switchover, Restore-Tests – dokumentiert.</li>
<li><b>RBAC</b>: Least Privilege; GreenLake-Rollen, lokale Rollen, LDAP/AD, 2FA; StoreOnce Dual Authorization.</li>
<li><b>Lifecycle-Datenmanagement</b>: Aufbewahrung, Verlagerung (Cloud Bank, Tape), Archiv, sicheres Löschen; UNMAP für Thin Reclamation.</li>
</ul>`},

{id:"k20",title:"Monitoring, Optimierung und Troubleshooting",topics:["monitoring","optimierung","troubleshooting"],min:12,
intro:"Telemetrie auswerten, Engpässe beheben und typische Fehler schnell finden.",
html:`
<h3>Monitoring</h3>
<ul>
<li><b>Data Ops Manager</b>: Performance-Charts (Predefined/Custom), Latency Insights, Hotspots, Headroom, Workload Drift, Resource Contention, Kapazitätstrends.</li>
<li><b>CLI/System Reporter</b>: statvlun, statvv (Echtzeit), srstatvlun/srstatvv (Historie), <b>createsralertcrit</b> für Performance-Alert-Kriterien (5-Minuten/stündlich/täglich).</li>
<li><b>Benachrichtigung</b>: E-Mail/SMTP, Syslog/SIEM, SNMP, Webhooks; Call Home sendet Status, Konfiguration, Metriken, Alerts – <b>keine Nutzdaten</b>.</li>
<li><b>Prädiktiv</b>: Predictive Drive Failure, PD-Scrubber, LESB-Alerts bei CRC-Fehlern, MSA Health Check.</li>
</ul>
<h3>Optimierungsplan</h3>
<ol><li>Baseline messen</li><li>Engpass bestimmen (CPU, Laufwerke, Pfade, Netz, Cache)</li><li>Optionen bewerten (Nutzen, Kosten, Risiko)</li><li>priorisiert im Change-Fenster umsetzen</li><li>Ergebnis messen</li></ol>
<ul>
<li>Noisy Neighbor → <b>Priority Optimization (QoS)</b>.</li>
<li>CPU-gebunden → Controller-Upgrade oder mehr Knoten; kapazitätsgebunden → JBOFs/Laufwerke.</li>
<li>Read-lastig auf HDD (MSA) → SSD Read Cache oder Tiering.</li>
<li>Dedupe verbessern → 16-KiB-Allokationseinheiten, keine Gast-Verschlüsselung.</li>
<li>Kapazität zurückgewinnen → UNMAP, Snapshot-Aufbewahrung anpassen.</li>
</ul>
<h3>Troubleshooting – häufige Fälle</h3>
<table><thead><tr><th>Symptom</th><th>Ursache / Maßnahme</th></tr></thead><tbody>
<tr><td>Host sieht Volume nicht</td><td>Zoning, Host-WWPNs, Export, Rescan</td></tr>
<tr><td>Nur halbe Pfadanzahl</td><td>Fabric/Switch-Ausfall oder fehlendes Zoning in einem Fabric</td></tr>
<tr><td>iSCSI langsam/Drops nach Netzänderung</td><td>MTU-Inkonsistenz (Jumbo Frames)</td></tr>
<tr><td>CRC-Fehler, LESB-Alerts</td><td>Kabel/Optik prüfen, D_Port-Test, tauschen</td></tr>
<tr><td>Schreibfehler trotz „freiem“ Platz</td><td>Thin-Pool voll → erweitern, Reclamation, Schwellwerte</td></tr>
<tr><td>StoreOnce voll trotz abgelaufener Backups</td><td>Housekeeping blockiert (Blackout Windows, Dauerjobs)</td></tr>
<tr><td>Replikations-Lag wächst</td><td>Bandbreite zu klein für Änderungsrate</td></tr>
<tr><td>Veeam fällt auf Network Mode zurück</td><td>Proxy ohne FC-Zugriff (VM statt physischer Proxy)</td></tr>
<tr><td>MSA: ein Controller überlastet</td><td>Volumes auf Pool A und B verteilen</td></tr>
</tbody></table>
<div class="callout remember"><b>Prävention:</b> Firmware konsistent und aktuell (Stabilität, Kompatibilität, Sicherheit, neue Funktionen), Health Checks, prädiktive Analysen, Redundanzprüfung, regelmäßige DR-Tests, Change-Management.</div>`},

{id:"k21",title:"Sicherheit und Cyber-Resilienz",topics:["sicherheit"],min:9,
intro:"Verschlüsselung, Immutability, Ransomware-Erkennung, Authentifizierung und Mandantentrennung.",
html:`
<table><thead><tr><th>Schutzziel</th><th>B10000</th><th>StoreOnce</th><th>Weitere</th></tr></thead><tbody>
<tr><td>Data at Rest</td><td>SED/FIPS-140-3-SSDs (Level 3), Encryption-LTU, LKM oder externer KMS</td><td>Software-Verschlüsselung pro Store (AES-256)</td><td>LTO-Hardwareverschlüsselung</td></tr>
<tr><td>Data in Flight</td><td>TLS-Management, Replikation über gesicherte Netze</td><td>IPsec für Catalyst</td><td>FC-ISL-Verschlüsselung (B-series)</td></tr>
<tr><td>Unveränderbarkeit</td><td><b>Virtual Lock</b> (Compliance-Clock)</td><td>Catalyst-Immutability</td><td>S3 Object Lock (X10000), LTO-WORM</td></tr>
<tr><td>Erkennung</td><td>Ransomware-Erkennung (ML, Block und File)</td><td>–</td><td>Zerto-Echtzeit-Verschlüsselungserkennung</td></tr>
<tr><td>Zugriff</td><td>RBAC, <b>2FA (CAC/Authenticator)</b>, Virtual Domains</td><td><b>Dual Authorization</b>, MFA, Secure Erase</td><td>GreenLake-Rollen, Zero Trust (Zerto Vault)</td></tr>
</tbody></table>
<ul>
<li>Encryption auf der B10000: jederzeit non-disruptive aktivierbar, danach nicht deaktivierbar.</li>
<li>Replikation ist kein Ransomware-Schutz – verschlüsselte Daten werden mitrepliziert.</li>
<li>Release 6: Continuous Security Posture Monitoring, SIEM/XDR-Integration, STIG-Hardening, Zuordnung zum NIST CSF (Govern, Identify, Protect, Detect, Respond, Recover).</li>
</ul>`},

{id:"k22",title:"IT-Trends und Cloud-Modelle",topics:["trends"],min:7,
intro:"KI, Container, Private Cloud, Virtualisierungsalternativen und as-a-Service.",
html:`
<ul>
<li><b>Cloud-Modelle</b>: IaaS, PaaS, SaaS; Public, Private, Hybrid, Multicloud; STaaS. GreenLake bringt das Cloud-Betriebsmodell on-prem.</li>
<li><b>KI</b>: Training braucht parallelen Lesedurchsatz auf große unstrukturierte Daten (X10000, RDMA/GPUDirect). <b>Supervised Learning</b> = gelabelte Trainingsdaten. <b>HPE Private Cloud AI</b>: schlüsselfertig mit NVIDIA, inkl. AI Essentials, Installation und Support; Partner-Chancen bei Datenpipelines und Use Cases.</li>
<li><b>HPE Data Fabric</b>: globaler Namensraum, Multiprotokoll-Zugriff, Datenplatzierung über Edge/Core/Cloud.</li>
<li><b>Container</b>: HPE CSI Driver for Kubernetes (dynamische Volumes, Snapshots, Klone, RWX über B10000 File Service, Integration mit Active Peer Persistence).</li>
<li><b>Virtualisierung</b>: HPE Morpheus VM Essentials (KVM-basierter HVM, verwaltet auch ESXi; GFS2/NFS-Datastores; „Archives“ als Dateiablage für Skripte).</li>
<li><b>NVMe-oF</b> (vor allem NVMe/TCP), <b>QLC</b> statt HDD, <b>Disaggregation</b>, <b>AIOps/agentische KI</b>, <b>Nachhaltigkeit</b> (Energie-Garantie, CO₂-Metriken), <b>Cyber-Resilienz</b>.</li>
</ul>`}
);
