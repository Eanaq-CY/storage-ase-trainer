/* Lernkapitel Teil 1: Grundlagen und HPE-Plattformen */
window.ASE = window.ASE || {};
ASE.chapters = ASE.chapters || [];
ASE.chapters.push(
{id:"k01",title:"Speicherarchitekturen: Block, File, Object",topics:["grundlagen"],min:12,
intro:"Die drei Zugriffsarten und die klassischen Architekturen DAS, NAS, SAN, SDS, HCI – Grundlage für jede Positionierung.",
html:`
<h3>Die drei Zugriffsarten</h3>
<table><thead><tr><th></th><th>Block</th><th>File</th><th>Object</th></tr></thead><tbody>
<tr><td>Einheit</td><td>Blöcke fester Größe (LBA)</td><td>Dateien in Verzeichnissen</td><td>Objekte = Daten + Metadaten + ID</td></tr>
<tr><td>Zugriff</td><td>FC, iSCSI, NVMe-oF, SAS</td><td>NFS (Linux), SMB (Windows)</td><td>HTTP/REST, S3-API</td></tr>
<tr><td>Dateisystem</td><td>beim Host (NTFS, VMFS, XFS, GFS2)</td><td>im Speichersystem</td><td>keines – flacher Namensraum (Buckets)</td></tr>
<tr><td>Stärken</td><td>niedrige Latenz, Datenbanken, VMs</td><td>gemeinsame Dateien, Home-Laufwerke</td><td>massive Skalierung, Metadaten, Backup, KI-Data-Lakes</td></tr>
<tr><td>HPE-Beispiel</td><td>Alletra Storage MP B10000, MSA</td><td>B10000 Unified File, GreenLake for File, X10000 (File seit 2026)</td><td>Alletra Storage MP X10000</td></tr>
</tbody></table>
<div class="callout remember"><b>Merke:</b> Block = „rohe Platte“ für den Host; File = „Netzlaufwerk“; Object = „Webdienst für Daten“. Transaktionale Datenbanken mit Sub-Millisekunden-Latenz gehören nicht auf Object Storage.</div>
<h3>Architekturen</h3>
<ul>
<li><b>DAS</b> – Speicher direkt am Server (intern oder SAS). Einfach, schnell, aber nicht teilbar → <i>Speicherinseln</i>, schlechte Auslastung, kein Shared Storage für Cluster.</li>
<li><b>NAS</b> – Datei-Zugriff über das IP-Netz (NFS/SMB). Das System verwaltet Rechte und Locks.</li>
<li><b>SAN</b> – dediziertes Speichernetz für Block-Zugriff. Konsolidierung, zentrale Pools, Cluster-Failover, VM-Mobilität.</li>
<li><b>SDS</b> – Software-Defined Storage: Speichersoftware auf Standardservern oder als VM (z. B. StoreOnce VSA).</li>
<li><b>HCI</b> – Compute, Storage und Virtualisierung in jedem Knoten (z. B. HPE SimpliVity); Wachstum immer im Paket.</li>
<li><b>dHCI</b> – disaggregiert: Server und Array wachsen getrennt, Verwaltung trotzdem einfach (früher Nimble/Alletra dHCI, heute z. B. HPE Private Cloud Business Edition mit B10000).</li>
<li><b>Converged Infrastructure</b> – vorvalidiertes Bundle aus weiterhin getrennten Komponenten.</li>
<li><b>Unified Storage</b> – ein System für Block <i>und</i> File (z. B. B10000 mit Unified File).</li>
</ul>
<h3>Erasure Coding vs. RAID</h3>
<p>RAID schützt innerhalb eines Laufwerkverbunds. <b>Erasure Coding</b> zerlegt Daten in k Daten- und m Paritätsfragmente und verteilt sie über viele Laufwerke oder Knoten – Standard bei Scale-out- und Object-Storage (z. B. X10000). Es toleriert m Ausfälle und ist effizienter als Spiegelung.</p>
<div class="callout tip"><b>Prüfungstipp:</b> Bei „Welcher Speicher für …?“-Fragen zuerst das Zugriffsprotokoll und das I/O-Profil bestimmen, dann das Produkt wählen.</div>`},

{id:"k02",title:"Laufwerke, Medien und RAID",topics:["medien"],min:12,
intro:"HDD, SSD, NVMe, TLC/QLC, Endurance und RAID inklusive Write Penalty – die Rechengrundlage für jedes Sizing.",
html:`
<h3>Medien im Überblick</h3>
<table><thead><tr><th>Medium</th><th>Typische Leistung</th><th>Einsatz</th></tr></thead><tbody>
<tr><td>7.2K Midline/NL-SAS-HDD</td><td>ca. 75–100 IOPS</td><td>Kapazität, Archiv, Backup</td></tr>
<tr><td>10K-SAS-HDD</td><td>ca. 125–150 IOPS</td><td>ausgewogen (MSA Standard-Tier)</td></tr>
<tr><td>SAS-SSD</td><td>zehntausende IOPS</td><td>MSA Performance-Tier, Read Cache</td></tr>
<tr><td>NVMe-SSD (TLC/QLC)</td><td>sehr hohe IOPS, µs-Latenz</td><td>B10000, X10000</td></tr>
</tbody></table>
<ul>
<li><b>SAS vs. SATA:</b> SAS ist dual-ported (zwei Controller-Pfade), vollduplex – Enterprise-Standard. SATA ist single-ported.</li>
<li><b>NVMe:</b> direkt über PCIe, bis 64K Queues × 64K Befehle, kein SCSI-Stack → geringste Latenz.</li>
<li><b>TLC vs. QLC:</b> QLC (4 Bit/Zelle) ist dichter und günstiger, hat aber weniger Schreib-Endurance. Bei der B10000 laut QuickSpecs: QLC <b>0,26 DWPD</b>, TLC <b>1,0 DWPD</b>.</li>
<li><b>DWPD</b> = Drive Writes Per Day. Beispiel: 15,36-TB-QLC × 0,26 ≈ 4 TB Schreiblast pro Tag.</li>
<li><b>SED/FIPS:</b> selbstverschlüsselnde Laufwerke (AES-256), FIPS-validiert für Behördenanforderungen.</li>
</ul>
<h3>RAID-Level</h3>
<table><thead><tr><th>RAID</th><th>Prinzip</th><th>Toleranz</th><th>Effizienz</th><th>Write Penalty</th></tr></thead><tbody>
<tr><td>0</td><td>Striping</td><td>keine</td><td>100 %</td><td>1</td></tr>
<tr><td>1 / 10</td><td>Spiegelung (+Striping)</td><td>1 je Spiegel</td><td>50 %</td><td>2</td></tr>
<tr><td>5</td><td>einfache Parität</td><td>1</td><td>(n−1)/n</td><td>4</td></tr>
<tr><td>6</td><td>doppelte Parität</td><td>2</td><td>(n−2)/n, 10+2 = 83 %</td><td>6</td></tr>
</tbody></table>
<div class="callout remember"><b>Merke:</b> Back-end-IOPS = Lese-IOPS + Schreib-IOPS × Write Penalty. Große Laufwerke rebuilden lange → doppelte Parität oder verteiltes RAID.</div>
<h3>Verteiltes RAID und Sparing bei HPE</h3>
<ul>
<li><b>B10000:</b> ausschließlich <b>RAID 6</b>; Laufwerke werden in 1-GiB-<b>Chunklets</b> zerlegt, RAID-6-Sets über Chunklets verschiedener Laufwerke gebildet; <b>system-weites Sparing</b> statt Hot-Spare-Laufwerken (many-to-many Rebuild).</li>
<li><b>MSA-DP+</b> (MSA Gen6/Gen7): verteilte Spare-Kapazität (Standard = Summe der zwei größten Disks), sehr schnelle Rebuilds; Kapazitäten nur bis Faktor 2 mischen.</li>
<li><b>Nimble/Alletra 5000/6000:</b> Triple+ Parity RAID (drei gleichzeitige Ausfälle).</li>
</ul>
<h3>TB vs. TiB</h3>
<p>1 TiB = 2<sup>40</sup> Byte ≈ 1,0995 TB. 15,36 TB ≈ 13,97 TiB. HPE-QuickSpecs nennen oft beide Werte – beim Sizing konsequent eine Einheit verwenden.</p>`},

{id:"k03",title:"SAN, Protokolle und Host-Präsentation",topics:["san"],min:15,
intro:"Fibre Channel, iSCSI, NVMe-oF, Topologien, Zoning, LUN-Masking (SSP) und Multipathing.",
html:`
<h3>Transportprotokolle</h3>
<table><thead><tr><th>Protokoll</th><th>Transport</th><th>Kennzeichen</th></tr></thead><tbody>
<tr><td>Fibre Channel</td><td>eigenes FC-Fabric</td><td>verlustfrei (Buffer Credits), WWPN-Adressierung, Gen 5/6/7 = 16/32/64 Gb</td></tr>
<tr><td>iSCSI</td><td>TCP/IP-Ethernet</td><td>Port 3260, IQN-Namen, CHAP optional</td></tr>
<tr><td>FCoE</td><td>Lossless Ethernet (DCB)</td><td>FC-Frames ohne TCP/IP, CNAs</td></tr>
<tr><td>NVMe/FC</td><td>FC-Fabric</td><td>NVMe-Befehle über FC</td></tr>
<tr><td>NVMe/TCP</td><td>Standard-Ethernet</td><td>NVMe-Vorteile ohne dediziertes FC-Netz (B10000 unterstützt es)</td></tr>
<tr><td>NVMe/RoCE</td><td>RDMA, Lossless Ethernet</td><td>sehr geringe Latenz; B10000 nutzt RoCEv2 intern im Backend</td></tr>
</tbody></table>
<h3>Fibre-Channel-Begriffe</h3>
<ul>
<li><b>WWPN/WWNN</b> – 64-Bit-Namen für Port bzw. Knoten. <b>Domain-ID</b> – eindeutige Switch-ID (1–239).</li>
<li><b>Porttypen:</b> N_Port (Host/Array), F_Port (Switch-Port für Endgerät), <b>E_Port (ISL zwischen Switches)</b>, EX_Port (FC-Router), FL_/NL_Port (Arbitrated Loop).</li>
<li><b>NPIV</b> – mehrere virtuelle WWPNs über einen Port; <b>NPV/Access Gateway</b> – Switch reicht Logins weiter.</li>
</ul>
<h3>Topologien</h3>
<ul>
<li><b>Single Switch</b> – einfach, aber begrenzt.</li>
<li><b>Kaskade</b> – Switch an Switch: steigende Hops, Single Points of Failure.</li>
<li><b>Ring</b> – etwas redundanter als Kaskade, aber schlecht skalierbar.</li>
<li><b>Full Mesh</b> – jeder mit jedem: 1 Hop, aber n·(n−1)/2 ISLs.</li>
<li><b>Core-Edge</b> – Hosts am Edge, Storage am Core/Director: Standard für skalierbare SANs.</li>
<li><b>Edge-Core-Edge</b> – Storage an eigenen Edge-Switches für sehr große Fabrics.</li>
</ul>
<div class="callout remember"><b>Merke:</b> Best Practice sind <b>zwei physisch getrennte Fabrics (A/B)</b>. Jeder Host und jedes Array ist an beide angebunden, Multipathing nutzt beide.</div>
<h3>Präsentation an Hosts</h3>
<ul>
<li><b>Zoning</b> (im Switch): wer sieht wen. Best Practice: <b>Single-Initiator-Zoning</b>, WWPN-basiert. <b>Hard Zoning</b> wird im ASIC erzwungen, <b>Soft Zoning</b> filtert nur Name-Server-Antworten. <b>HPE Smart SAN</b> automatisiert Target-Driven Peer Zoning.</li>
<li><b>LUN-Masking / SSP</b> (im Array): ein Volume wird nur definierten Hosts präsentiert (Host-Objekt mit WWPN/IQN/NQN + Export). SSP = Selective Storage Presentation.</li>
<li><b>Host-Objekt</b> in Data Ops Manager: Name, <b>Betriebssystem</b> (Host-Persona) und Initiatoren; optional Hostgruppe.</li>
</ul>
<h3>Multipathing und ALUA</h3>
<p>MPIO (Windows: Feature MPIO + DSM), DM-Multipath (Linux) oder VMware NMP (Round Robin) nutzen mehrere Pfade für Redundanz und Lastverteilung. <b>ALUA</b> meldet bei asymmetrischen Arrays (z. B. MSA mit Pool-Besitz je Controller) optimierte und nicht-optimierte Pfade; NVMe nutzt dafür <b>ANA</b>.</p>
<h3>iSCSI-Best-Practices</h3>
<ul><li>eigenes VLAN/Subnetz, getrennt vom Client-Verkehr</li><li>MTU durchgängig konsistent (Jumbo Frames überall oder nirgends)</li><li>MPIO statt LACP/Teaming für Pfadredundanz</li><li>mehrere Subnetze/Sessions für mehrere Pfade, optional CHAP</li></ul>
<div class="callout tip"><b>Prüfungstipp:</b> „Wo wird was konfiguriert?“ – Zoning = Switch, LUN-Masking = Array, MPIO/DSM = Betriebssystem. iLO hat mit Multipathing nichts zu tun.</div>`},

{id:"k04",title:"Speicheroptimierung",topics:["effizienz"],min:10,
intro:"Thin Provisioning, Deduplizierung, Kompression, Data Packing, Tiering und QoS.",
html:`
<h3>Kapazitätseffizienz</h3>
<ul>
<li><b>Thin Provisioning</b> – Platz wird erst beim Schreiben belegt. Risiko: Overcommitment → Schwellwerte, Trends, Alerts. Bei vollem Pool schlagen Writes fehl.</li>
<li><b>Space Reclamation</b> – SCSI UNMAP/TRIM (z. B. VMFS6 automatisch) und Zero Detect geben Platz zurück. Die B10000 gibt freie 16-KiB-Blöcke an das Volume und 128-MiB-Bereiche an die CPG zurück.</li>
<li><b>Deduplizierung</b> – gleiche Blöcke per Hash einmal speichern; inline oder post-process; quellseitig (StoreOnce Catalyst Low Bandwidth) oder zielseitig.</li>
<li><b>Kompression</b> – Blöcke kleiner kodieren.</li>
</ul>
<div class="callout official"><b>Offiziell (HPE, B10000-Architektur-Whitepaper, sinngemäß):</b> Die B10000 dedupliziert zuerst (<b>Express Indexing</b>, Hash-Lookup) und komprimiert danach die verbleibenden Daten (<b>Express Scan</b> prüft die Entropie und wählt das Kompressionslevel). <b>Data Packing</b> bündelt die so entstandenen Seiten ungerader Größe zu vollen RAID-Stripes – flash-freundlich und ohne Verschnitt. Daten werden in <b>16-KiB-Seiten</b> abgebildet. <a href="https://www.hpe.com/psnow/doc/a50008302enw" target="_blank" rel="noopener">Quelle</a></div>
<ul>
<li><b>Data Compaction</b> (HPE-Begriff) = Thin + Dedupe + Kompression + Copy-Technologien. Effektivkapazität der B10000 wird mit <b>4:1</b> gerechnet (StoreMore).</li>
<li><b>Schlechte Datenreduktion</b> bei verschlüsselten oder vorkomprimierten Daten (Video, verschlüsselte DBs) → ~1:1 ansetzen.</li>
<li><b>VMs auf der B10000:</b> Gast-Allokationseinheiten in Vielfachen von 16 KiB und keine Verschlüsselung im Gast verbessern die Deduplizierung.</li>
</ul>
<h3>Performance-Optimierung</h3>
<ul>
<li><b>Wide Striping</b> – alle Laufwerke tragen zu jedem Volume bei; keine Hotspots.</li>
<li><b>Tiering</b> – Sub-LUN-Verschiebung heißer Seiten (MSA: Performance/Standard/Archive).</li>
<li><b>SSD Read Cache</b> – Kopie häufig gelesener Daten (MSA bis 8,34 TB).</li>
<li><b>QoS</b> – <b>Priority Optimization</b> (B10000) setzt Ziele/Limits für IOPS, Bandbreite, Latenz pro Volume Set oder Virtual Domain; MSA: <b>Virtual Tier Affinity</b>.</li>
<li><b>VAAI</b> – ATS, XCOPY, Block Zero, UNMAP lagern Aufgaben an das Array aus.</li>
</ul>`},

{id:"k05",title:"Verfügbarkeit, Replikation und Multi-Site",topics:["verfuegbarkeit"],min:14,
intro:"RPO/RTO, Hochverfügbarkeit, synchrone und asynchrone Replikation, Peer Persistence und Quorum Witness.",
html:`
<h3>Begriffe</h3>
<ul>
<li><b>RPO</b> – maximal tolerierbarer Datenverlust (Zeit). <b>RTO</b> – maximale Zeit bis zur Wiederherstellung.</li>
<li><b>Fehlertoleranz</b> – Weiterbetrieb trotz Ausfall einzelner Komponenten. <b>Hochverfügbarkeit</b> – minimale Ausfallzeit durch Redundanz/Failover. <b>Disaster Recovery</b> – Richtlinien, Tools und Verfahren zur Wiederherstellung nach Katastrophen.</li>
<li><b>BIA</b> – Business Impact Analysis: Kritikalität und Ausfallkosten je Prozess → Basis für RTO/RPO und Budget.</li>
</ul>
<table><thead><tr><th>Verfügbarkeit</th><th>Ausfall/Jahr</th></tr></thead><tbody>
<tr><td>99,9 %</td><td>≈ 8,76 h</td></tr><tr><td>99,99 %</td><td>≈ 52,6 min</td></tr><tr><td>99,999 %</td><td>≈ 5,26 min</td></tr><tr><td>99,9999 % (Nimble/Alletra 6000)</td><td>≈ 31,5 s</td></tr><tr><td>100 % Datenverfügbarkeit (Garantie B10000)</td><td>Vertragszusage</td></tr>
</tbody></table>
<h3>Replikationsarten</h3>
<ul>
<li><b>Synchron</b> – Ack erst nach Remote-Write: RPO 0, aber Latenz/Distanz begrenzt (Metro). Bandbreite nach <b>Spitzen-Schreiblast</b> dimensionieren.</li>
<li><b>Asynchron</b> – lokales Ack, zeitversetzte Übertragung: RPO &gt; 0, große Distanzen. Bandbreite nach Änderungsrate im RPO-Fenster.</li>
<li><b>Snapshot-basiert</b> – z. B. MSA Remote Snap: nur Delta zwischen zwei Snapshots.</li>
<li><b>Konsistenzgruppen</b> – mehrere Volumes write-order-konsistent (Remote-Copy-Gruppe, Zerto-VPG).</li>
<li><b>3DC</b> – synchron zum nahen + asynchron zum fernen Standort.</li>
</ul>
<div class="callout official"><b>Offiziell (HPE, B10000-Architektur-Whitepaper, sinngemäß):</b> Remote Copy bietet <b>synchron</b>, <b>Asynchronous Periodic</b> (Sync-Intervall ab 15 s, bestenfalls ca. 30 s RPO) und <b>Synchronous Long Distance</b>; Transport über IP (10/25GbE) oder FC (32/64Gb). <b>Active Peer Persistence</b> kombiniert synchrone Replikation mit transparentem Failover für vSphere-, Windows- und Hyper-V-Cluster. Automatisches Failover erfordert den <b>HPE Quorum Witness</b> auf separater Infrastruktur, nicht Teil der Host-Cluster und über vom Replikationsnetz unabhängige Netze verbunden; manuelles transparentes Failover geht auch ohne. <a href="https://www.hpe.com/psnow/doc/a50008302enw" target="_blank" rel="noopener">Quelle</a></div>
<h3>Peer Persistence im Detail</h3>
<ul>
<li>Beide Arrays präsentieren das Volume mit gleicher Identität; Pfadzustände (ALUA) steuern, welches Array aktiv bedient.</li>
<li><b>Uniform Host Access</b>: Hosts beider Standorte sind mit beiden Arrays verbunden (Cross-Connect).</li>
<li>Der <b>Quorum Witness</b> am dritten Standort unterscheidet Array-, Standort- und Link-Ausfall und verhindert <b>Split Brain</b>. Fällt nur der Witness aus, läuft der I/O weiter – nur die Automatik fehlt.</li>
<li><b>Active Sync Replication</b> (ohne Cross-Connect) bietet weniger HA als Active Peer Persistence.</li>
<li>Einsatz: VMware <b>vMSC</b> (Stretched Cluster).</li>
</ul>
<div class="callout tip"><b>Prüfungstipp:</b> RPO 0 → synchron. RPO Sekunden, hardware-unabhängig → Zerto. RPO Minuten/Stunden, große Distanz → asynchron. Replikation ersetzt kein Backup (Ransomware wird mitrepliziert).</div>`},

{id:"k06",title:"Datensicherung: Konzepte",topics:["backup"],min:12,
intro:"Backup-Arten, Snapshots, 3-2-1-1-0, Tape, Immutability und Air Gap.",
html:`
<h3>Backup-Arten</h3>
<table><thead><tr><th>Art</th><th>Sichert</th><th>Restore benötigt</th></tr></thead><tbody>
<tr><td>Voll</td><td>alles</td><td>1 Sicherung</td></tr>
<tr><td>Inkrementell</td><td>Änderungen seit letztem Backup beliebigen Typs</td><td>Full + alle Inkremente</td></tr>
<tr><td>Differenziell</td><td>Änderungen seit letztem Full</td><td>Full + letztes Differenzial</td></tr>
<tr><td>Synthetic Full</td><td>Full, auf dem Ziel aus Full + Inkrementen gebaut</td><td>1 Sicherung, ohne Produktionslast</td></tr>
</tbody></table>
<ul>
<li><b>CBT</b> (Changed Block Tracking) ermöglicht schnelle inkrementelle Image-Backups von VMs („incremental forever“).</li>
<li><b>Anwendungskonsistent</b> (z. B. VSS, Datenbank-Plugins) vs. <b>crash-konsistent</b> (Zustand wie nach Stromausfall).</li>
<li><b>GFS</b> (Grandfather-Father-Son): tägliche, wöchentliche, monatliche Generationen.</li>
</ul>
<h3>Snapshots</h3>
<p>Snapshots sind schnelle Point-in-Time-Kopien – aber <b>kein Backup allein</b>, da sie auf demselben System liegen. <b>Copy-on-Write</b> kopiert Originalblöcke vor dem Überschreiben (Zusatz-I/O), <b>Redirect-on-Write</b> schreibt neu und passt Zeiger an. Snapshot-Kapazität = geänderte Daten pro Tag × Aufbewahrungstage (bei einzigartigen Änderungen).</p>
<h3>Strategie und Cyber-Resilienz</h3>
<div class="callout remember"><b>3-2-1-1-0:</b> 3 Kopien, 2 Medien, 1 extern, 1 offline/unveränderbar, 0 Fehler bei Restore-Tests.</div>
<ul>
<li><b>Immutability/WORM</b>: Virtual Lock (B10000), Catalyst-Immutability (StoreOnce), S3 Object Lock (X10000), LTO-WORM.</li>
<li><b>Air Gap</b>: Offline-Tape, MSL Vault Partition, Zerto Cyber Resilience Vault. Schützt die Wiederherstellbarkeit – längerer RTO, „letzte Verteidigungslinie“.</li>
<li><b>Restore-Quelle nach Ransomware</b>: die unveränderbare Kopie (z. B. Catalyst-Immutability mit Dual Authorization), nicht das synchrone Replikat oder schreibbare Shares.</li>
</ul>
<h3>Backup vs. Archiv</h3>
<p>Backup = kurzfristiger Schutz mit mehreren Versionen für Restore. Archiv = langfristige Aufbewahrung, meist eine durchsuchbare Instanz (Compliance, Kostenentlastung der Produktion).</p>
<h3>Tape (LTO)</h3>
<table><thead><tr><th>Generation</th><th>Nativ</th><th>Komprimiert (2,5:1)</th></tr></thead><tbody>
<tr><td>LTO-8</td><td>12 TB</td><td>30 TB</td></tr><tr><td>LTO-9</td><td>18 TB</td><td>45 TB</td></tr><tr><td>LTO-10</td><td>30 TB</td><td>75 TB</td></tr>
</tbody></table>
<p>LTFS (ab LTO-5, Partitionierung) erlaubt dateisystemartigen Zugriff; Hardware-Verschlüsselung (AES-256) ab LTO-4; WORM-Kassetten für Compliance.</p>`},

{id:"k07",title:"HPE-Storage-Portfolio und Positionierung",topics:["staerken"],min:8,
intro:"Welches Produkt für welchen Kunden? Die Landkarte für Positionierungs- und Stärken-Fragen.",
html:`
<table><thead><tr><th>Bedarf</th><th>HPE-Lösung</th><th>Kernargument</th></tr></thead><tbody>
<tr><td>Geschäftskritischer Block (DB, VMs, SAP)</td><td>Alletra Storage MP <b>B10000</b></td><td>Disaggregiert, all-NVMe, 100 %-Garantie, Cloud-Management, Mission-Critical zum Midrange-Preis</td></tr>
<tr><td>Block + angrenzendes File</td><td>B10000 <b>Unified File</b> (NFS)</td><td>Ein System, ein OS – z. B. Scale-out SAP HANA</td></tr>
<tr><td>Object/KI-Data-Lake, PB-Skala</td><td>Alletra Storage MP <b>X10000</b></td><td>S3, RDMA/GPUDirect, unabhängige Skalierung, seit 2026 auch File</td></tr>
<tr><td>High-Performance File für KI/Analytics</td><td><b>GreenLake for File Storage</b></td><td>All-NVMe ohne Caching/Tiering, DASE</td></tr>
<tr><td>Entry-SAN für SMB/Zweigstellen</td><td><b>MSA Gen7</b></td><td>Einfach, preiswert, Echtzeit-Tiering, selbst installierbar</td></tr>
<tr><td>Deduplizierendes Backup-Ziel</td><td><b>StoreOnce</b></td><td>Catalyst, bis 300 TB/h, Cloud Bank, Immutability, Dual Authorization</td></tr>
<tr><td>Langzeit/Offline</td><td><b>StoreEver</b> (LTO, MSL)</td><td>Niedrigste Kosten/TB, Air Gap, WORM</td></tr>
<tr><td>CDP/DR/Migration für VMs</td><td><b>Zerto</b></td><td>RPO Sekunden, hardware-unabhängig, Cyber Resilience Vault</td></tr>
<tr><td>SaaS-Backup</td><td>GreenLake for <b>Backup and Recovery</b></td><td>Snapshots → lokal → Cloud, Immutability</td></tr>
<tr><td>Speichernetz</td><td><b>B-series / C-series</b></td><td>Switches und Directors, SANnav</td></tr>
<tr><td>Betriebsmodell</td><td><b>GreenLake</b> (DSCC, Flex)</td><td>Cloud-Management, nutzungsbasierte Abrechnung</td></tr>
</tbody></table>
<h3>Stärken → Chancen</h3>
<ul>
<li><b>3PAR/Primera/Nimble-Bestand mit Support-Ende</b> → B10000 + Peer Motion + Future-Ready-Garantien.</li>
<li><b>Überprovisionierung</b> → disaggregierte Skalierung (Kapazität und Performance getrennt).</li>
<li><b>Viele Standorte, wenig Personal</b> → DSCC-Flottenmanagement, AIOps, Blueprints.</li>
<li><b>Ransomware-Sorge</b> → Erkennung + Virtual Lock (B10000), Immutability + Dual Authorization (StoreOnce), Zerto Vault, Tape.</li>
<li><b>OPEX-Wunsch</b> → GreenLake Flex.</li>
<li><b>VMware-Lizenzdruck</b> → HPE Morpheus VM Essentials + Zerto-Migration.</li>
</ul>`},

{id:"k08",title:"HPE Alletra Storage MP B10000",topics:["b10000"],min:22,
intro:"Das Kernprodukt beider ASE-Prüfungen: Architektur, Modelle, Regeln, Software, Garantien und Neuerungen bis Release 6.",
html:`
<div class="callout official"><b>Offiziell (HPE QuickSpecs, sinngemäß):</b> Die B10000 (früher „HPE GreenLake for Block Storage built on HPE Alletra Storage MP“) bringt Mission-Critical-Storage in den Midrange. Sie ist laut HPE das erste disaggregierte Scale-out-Block-Storage mit 100 %-Verfügbarkeitsgarantie, wird cloud-basiert verwaltet und skaliert Performance und Kapazität unabhängig. <a href="https://www.hpe.com/us/en/greenlake/block-storage-service.html" target="_blank" rel="noopener">Quelle</a></div>
<h3>Architektur</h3>
<ul>
<li><b>Disaggregiert, shared-everything, all-active:</b> alle Controller und Ports aktiv, nichts im Standby; massiv parallel, Wide Striping über alle Ressourcen.</li>
<li><b>Hardware:</b> Alletra-MP-10000-Chassis (2U, 2 Knoten), Controller mit 8/16/32 Kernen; JBOF-Shelves (2U, 8–24 NVMe-SSDs).</li>
<li><b>Backend:</b> 100GbE RoCEv2 (NVMe-oF). Cluster-Interconnect 25 Gb (switchless) bzw. 100 Gb (switched) per RDMA; separates 1GbE-Steuernetz.</li>
<li><b>Schreib-Cache:</b> write-through – keine Batterien. Bei Stromausfall liest der Partnerknoten nicht destagte Daten aus dem Volume-Staging-Bereich auf den Laufwerken.</li>
<li><b>Virtualisierung:</b> 1-GiB-Chunklets → Logical Disks (RAID 6) → CPGs → Thin Volumes (VVs, max. 64 TiB) → Export als VLUNs; Datenabbildung in 16-KiB-Seiten.</li>
<li><b>RAID:</b> nur RAID 6; Set-Größe automatisch (typisch 10+2). <b>Express Layout</b>: Knoten teilen Laufwerke – schon bei 12 Laufwerken 10+2 je Knoten.</li>
<li><b>HA-Level</b> einer CPG (cage/disk) wird standardmäßig automatisch aus der Systemkonfiguration bestimmt; <b>system-weites Sparing</b> über Spare-Chunklets, <b>Adaptive Sparing</b> verlängert die SSD-Lebensdauer.</li>
</ul>
<h3>Modelle und Skalierung</h3>
<table><thead><tr><th>Familie</th><th>Modelle</th><th>Knoten</th><th>Shelves</th></tr></thead><tbody>
<tr><td>B10100 switchless</td><td>B10120 (8 Kerne), B10130 (16), B10140 (32)</td><td>2 (B10140 ab 10.5.50 auch 4)</td><td>B10120: keine · B10130/40: bis 2 JBOF</td></tr>
<tr><td>B10200 switched</td><td>B10230 (16), B10240 (32)</td><td>2–4 (QuickSpecs 2025), ab Release 10.6: bis 6</td><td>bis 16 JBOF (1–8 Performance, 9–16 Capacity Optimized)</td></tr>
</tbody></table>
<ul>
<li>Kapazität: von 15,36 TB bis ca. 5,8 PB roh (16 JBOF × 24 × 15,36 TB), effektiv bis ca. 16,6 PB bei 4:1.</li>
<li>Switched: Controller-Chassis ohne SSDs; zwei 32-Port-100GbE-Switches nur für das Backend (nicht für Hosts!).</li>
<li><b>Upgrades (non-disruptive):</b> B10120/B10130/B10230-Controller auf stärkere Knoten; switchless B10130/B10140 → switched; switched 2 → 6 Knoten in Einzelschritten.</li>
</ul>
<h3>Laufwerke</h3>
<ul>
<li>TLC: 1,92 / 3,84 / 7,68 / 15,36 TB (SED oder FIPS); QLC: 15,36 / 30,72 TB (selbstverschlüsselnd).</li>
<li>Min. 8 SSDs pro Chassis, Erweiterung in 2er-Schritten bis 24; ab Slot 1 lückenlos; Shelves ausgewogen.</li>
<li>Keine Mischung von Kapazitäten oder TLC/QLC im System. QLC-Eignung mit Ninja Online prüfen.</li>
</ul>
<h3>Konnektivität</h3>
<ul>
<li>Keine eingebauten Host-Ports: mind. 1 Host-HBA pro Knoten in <b>Slot 3/4</b>; Slot 1/2 = 100GbE-Backend.</li>
<li>32Gb-OCP-FC-HBA (mit 2 Transceivern) bzw. 32/64Gb-4-Port-FC-HBA (ohne Transceiver; aktuell nur 32Gb-SFPs) – SCSI und NVMe/FC; max. 2 FC-HBAs je Knoten, kein Mischen der FC-HBA-Typen.</li>
<li>10/25GbE-4-Port-HBA: iSCSI, NVMe/TCP, NFS, RCIP; Transceiver paarweise separat (2–4), alternativ DAC; 25Gb-SFP nur 25 Gb, 10Gb-SFP nur 10 Gb; max. 2 je Knoten.</li>
<li>OM4-Kabel für FC-Hosts und Peer Motion.</li>
</ul>
<h3>Software (ArcusOS)</h3>
<p>All-inclusive: Virtual Copy, Remote Copy, Priority Optimization (QoS), Peer Motion, Peer Persistence, Virtual Domains, Virtual Lock, 2FA, Ransomware-Erkennung. Nur <b>Data Encryption</b> benötigt eine eigene LTU (Standard oder FIPS) – jederzeit non-disruptive aktivierbar, aber <b>nicht wieder deaktivierbar</b>; Local Key Manager inklusive, externe KMS (Utimaco ESKM, SafeNet KeySecure) möglich.</p>
<p>Lizenzierung: <b>Software and Support SaaS</b> pro TB Rohkapazität (3/4/5 Jahre) + ArcusOS-LTU.</p>
<h3>Management</h3>
<ul>
<li>100 % Cloud-Management über <b>DSCC</b>: Setup Service (Ersteinrichtung, Blueprints), <b>Data Ops Manager</b> (Infrastruktur), <b>Block Storage</b> (Daten, intent-basierte Provisionierung).</li>
<li><b>Disconnected</b>-Variante für Dark Sites (GreenLake Dedicated Platform).</li>
<li>CLI mit stat*/srstat*-Befehlen (System Reporter) und createsralertcrit für Performance-Alerts.</li>
</ul>
<h3>Garantie, Support und Installation</h3>
<ul>
<li>Gewährleistung: 1 Jahr nur Teile; SSDs inkl. Verschleißersatz; Software-Medien 90 Tage. Support: Tech Care Basic/Essential/Critical.</li>
<li>Selbstinstallation laut QuickSpecs nur für switchless B10100 (in OCA wählbar), ohne Garantieverlust.</li>
<li><b>Future-Ready Program</b> (ehem. Timeless): 100 % Verfügbarkeit, StoreMore 4:1 (ab R6 5:1), kostenloser Controller-Refresh, 30-Tage-Zufriedenheit, Cyber Resiliency (Experte in 30 min), Energy Consumption, Zero RTO/RPO (Active Peer Persistence).</li>
</ul>
<h3>Releases</h3>
<ul>
<li><b>Release 5 (10.5)</b>: erster Schritt zu Unified File und Block, Ransomware-Erkennung; Basis der Cyber Resiliency Guarantee.</li>
<li><b>10.5.50 (Nov. 2025)</b>: switchless bis 4 Knoten.</li>
<li><b>Release 6 (10.6.0, GA Sep. 2026)</b>: bis 6 Knoten (zwei gleichzeitige Knotenausfälle verkraftbar), mehr File-Kapazität und Snapshots, Ransomware-Erkennung auch für File, agentische Support-Automatisierung, StoreMore 5:1, Backup-APIs mit StoreOnce.</li>
</ul>
<div class="callout tip"><b>Prüfungstipp:</b> Die Prüfungs-Blueprints stammen von 11/2025 (J83) und 04/2026 (J82). Wenn eine Frage „maximal 4 Knoten“ oder „4:1“ als Option hat und 6 bzw. 5:1 fehlen, gilt der damalige Stand.</div>`},

{id:"k09",title:"Alletra Storage MP X10000 und File-Storage",topics:["x10000"],min:8,
intro:"Object-Storage für KI und unstrukturierte Daten, GreenLake for File Storage und die Neuerungen 2026.",
html:`
<h3>X10000 – Object (und seit 2026 File)</h3>
<ul>
<li>S3/S3a-API, <b>containerisierte Software (Kubernetes)</b>, disaggregierte Shared-Everything-Architektur – Compute- und JBOF-Knoten skalieren unabhängig.</li>
<li><b>Log-strukturierter Key-Value-Store</b>: kleine PUTs landen im Schreibpuffer und werden erasure-codiert destaged → weniger Latenz und Write Amplification; optimiert für TLC/QLC.</li>
<li><b>RDMA / NVIDIA GPUDirect for S3</b> – direkter Datenpfad zu GPU-Servern.</li>
<li>Management über die HPE-GreenLake-Cloud (einheitlich für Block, File, Object).</li>
<li>Einsatz: KI-Data-Lakes, Analytics, Backup-Ziel mit S3 Object Lock, cloud-native Apps.</li>
</ul>
<div class="callout official"><b>Offiziell (HPE-Pressemitteilung Mai 2026, sinngemäß):</b> Der X10000 bietet File und Object auf einer Plattform (File GA Q2/2026), skaliert auf 16 Knoten und 23 PB roh, RDMA auch für File (Q3/2026), trägt die 100 %-Datenverfügbarkeitsgarantie und kann mit einem <b>Data Protection Accelerator Node</b> bis 2,5 PB/h Backup-Ingest erreichen. Laut StoreOnce-QuickSpecs sind bis zu 4 solcher StoreOnce-basierten Knoten und bis 480 PB effektiv möglich. <a href="https://www.hpe.com/us/en/newsroom/press-release/2026/05/hpe-delivers-unified-private-clouds-and-data-platforms-to-accelerate-enterprise-modernization-and-ai-data-readiness.html" target="_blank" rel="noopener">Quelle</a></div>
<h3>HPE GreenLake for File Storage</h3>
<ul>
<li>Alletra-MP-Hardware + VAST-Data-Software (DASE).</li>
<li>All-NVMe-Performance <b>ohne Front-end-Caching und ohne Datenbewegung zwischen Tiers</b>; Performance und Kapazität skalieren unabhängig – im Gegensatz zu Shared-Nothing-NAS.</li>
<li>Protokolle NFS, SMB, S3; Fokus KI, HPC, Analytics.</li>
</ul>
<h3>Abgrenzung</h3>
<p>B10000 Unified File = Block + angrenzende File-Workloads (z. B. SAP-HANA-Konfiguration). Massiv skalierende, performanceorientierte unstrukturierte Workloads → X10000 bzw. GreenLake for File.</p>`},

{id:"k10",title:"HPE MSA Gen7",topics:["msa"],min:12,
intro:"Entry-Shared-Storage: Modelle, Hardware, MSA-DP+, Tiering, Lizenzierung und Remote Snap.",
html:`
<div class="callout official"><b>Offiziell (HPE QuickSpecs, sinngemäß):</b> Die MSA ist seit Jahrzehnten der führende Shared Storage für ProLiant (über 600.000 Arrays). Gen7 liefert bis zu 2× mehr Random-IOPS und 30 % mehr sequenzielle Bandbreite als Gen6, skaliert über 7 PB und unterstützt Online-Firmware-Updates für Controller und Laufwerke. <a href="https://www.hpe.com/psnow/doc/a50009222enw" target="_blank" rel="noopener">Quelle</a></div>
<h3>Modelle</h3>
<ul>
<li><b>MSA 2070</b>: FC 16/32 Gb, iSCSI 10/25GbE, 10GBase-T, SAS 12 Gb; LFF oder SFF; TAA-Varianten.</li>
<li><b>MSA 2070 Flash Bundles</b>: All-Flash mit 23/46/92 TB.</li>
<li><b>MSA 2072</b>: Hybrid-Flash mit zwei integrierten 1,92-TB-SSDs und enthaltener <b>Advanced Data Services Suite</b>.</li>
</ul>
<h3>Hardware</h3>
<ul>
<li>2U, <b>immer 2 Controller</b> (active/active mit 2 Pools oder active/passive mit 1 Pool), 4 Host-Ports je Controller (8 je Array).</li>
<li>48 GB Cache/Systemspeicher, RAID-Offload-ASIC, Cache-Schutz batterielos mit Superkondensatoren + Flash.</li>
<li>Bis 9 Erweiterungsgehäuse (12 LFF / 24 SFF, mischbar) → max. 240 SFF / 120 LFF, 7,37 PB (SFF) bzw. 2,88 PB (LFF).</li>
<li>2 Pools à 4 PiB, Volumes bis 128 TiB, je 512 Volumes/Snapshots/Hosts, 1.024 Initiatoren, Read Cache bis 8,34 TB.</li>
<li>Kunde kann selbst installieren, reparieren (CSR) und upgraden.</li>
</ul>
<h3>RAID und MSA-DP+</h3>
<p>RAID 1, 5, 6, 10 und <b>MSA-DP+</b>; RAID 0 nur für den Read Cache. MSA-DP+ nutzt Erasure Coding, verteilte Spare-Kapazität (Standard = Summe der zwei größten Disks), sehr schnelle Rebuilds, keine Idle-Spares, schrittweise Erweiterung; Disks gleichen Typs, Kapazitätsverhältnis ≤ 2.</p>
<h3>Datenservices und Lizenz</h3>
<table><thead><tr><th>Funktion</th><th>Standard</th><th>Mit Advanced Data Services</th></tr></thead><tbody>
<tr><td>Snapshots</td><td>64</td><td>512 + Volume Copy</td></tr>
<tr><td>Tiering (Performance/Standard/Archive)</td><td>–</td><td>ja (Echtzeit, Sub-LUN)</td></tr>
<tr><td>Remote Snap</td><td>–</td><td>ja – Lizenz auf jedem beteiligten Array</td></tr>
<tr><td>SSD Read Cache</td><td>ja</td><td>ja</td></tr>
</tbody></table>
<div class="callout remember"><b>Merke:</b> Die ADS-Lizenz ist nötig, sobald HDDs und SSDs im selben System gemischt werden – außer SSDs dienen nur als Read Cache. Bei der 2072 ist sie enthalten.</div>
<h3>Remote Snap</h3>
<p>Asynchrone, snapshot-basierte Replikation über FC oder iSCSI; überträgt nur Änderungen; Failover/Failback und Richtungsumkehr; <b>Many-to-1</b> mit bis zu 4 Systemen (Zweigstellen → Zentrale).</p>
<h3>Management und Integration</h3>
<ul>
<li>SMU v4 (Web), CLI, REST (Redfish/Swordfish), <b>MSA Health Check</b>, Firmware Update Server; Online-Updates per Smart Components – <b>Hosts brauchen Multipathing</b>.</li>
<li>LDAP-Anbindung, SNMP/SMTP-Alerts, SED-Unterstützung (2070).</li>
<li>VMware: Storage Integration Pack for vCenter, VAAI (ATS, XCOPY, Block Zero), SRM; Zerto; qualifiziert für HPE Morpheus VM Essentials.</li>
</ul>`},

{id:"k11",title:"Vorgänger und Migration",topics:["legacy"],min:6,
intro:"3PAR, Primera, Nimble, Alletra 5000/6000/9000 und der Weg zur B10000.",
html:`
<table><thead><tr><th>Plattform</th><th>Merkmale</th></tr></thead><tbody>
<tr><td>HPE 3PAR StoreServ</td><td>ASIC (u. a. Zero Detect), Chunklets, Mesh-Active, Wide Striping, Persistent Ports, SSMC</td></tr>
<tr><td>HPE Primera / Alletra 9000</td><td>all-active, NVMe (9000), 100 %-Verfügbarkeitsgarantie</td></tr>
<tr><td>HPE Nimble / Alletra 5000/6000</td><td>CASL (log-strukturiert), Triple+ Parity, InfoSight-Ursprung, 99,9999 % Garantie; 5000 = Hybrid (Cache-zu-Disk-Verhältnis passend zum Working Set wählen), 6000 = All-Flash</td></tr>
<tr><td>Alletra dHCI</td><td>Server + Array, Verwaltung über das HPE-Plugin im vSphere Client</td></tr>
</tbody></table>
<ul>
<li><b>Nachfolger:</b> die B10000 – HPE bietet Transition-Programme für Nimble, Alletra 5000/6000 und 3PAR/Primera/Alletra 9000.</li>
<li><b>Peer Motion:</b> Online-Migration von 3PAR, Primera, Alletra 9000 und Nimble ohne Appliance im Datenpfad; mehrere Peer-Links, KI-gesteuerte Drosselung.</li>
<li><b>Persistent Ports:</b> Partner-Port übernimmt per NPIV die WWN – Hosts merken keine Pfadwechsel bei Upgrades.</li>
<li>Replikations-Interoperabilität zwischen Generationen in <b>SPOCK</b> prüfen.</li>
</ul>`}
);
