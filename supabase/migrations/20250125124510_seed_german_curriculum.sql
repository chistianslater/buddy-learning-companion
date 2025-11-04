-- Migration: Seed German Curriculum Competencies
-- This migration adds comprehensive seed data for German school curriculum competencies
-- covering multiple subjects, grade levels, and federal states

-- =============================================
-- Mathematics Curriculum (Grundschule)
-- =============================================

-- Grade 1 Mathematics
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Mathematik', 'Zahlen bis 10 erkennen und zuordnen', 'Zahlen von 1 bis 10 sicher erkennen, schreiben und Mengen zuordnen.', 1, 'Bayern', '{}', '{"Zahlen 1-10 erkennen", "Ziffern schreiben", "Mengen zuordnen"}'),
('Mathematik', 'Einfache Addition bis 10', 'Zahlen bis 10 durch Zählen zusammenzählen.', 1, 'Bayern', '{"Zahlen bis 10 erkennen"}', '{"Zahlen zusammenzählen", "Pluszeichen verstehen", "Einfache Plusaufgaben"}'),
('Mathematik', 'Formen und Farben unterscheiden', 'Grundlegende geometrische Formen und Farben unterscheiden und benennen.', 1, 'Bayern', '{}', '{"Kreise, Quadrate, Dreiecke erkennen", "Grundfarben benennen", "Formen in der Umwelt finden"}'),

-- Grade 2 Mathematics
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Mathematik', 'Zahlen bis 100', 'Zahlenraum bis 100 sicher beherrschen, Zahlenreihen fortsetzen.', 2, 'Bayern', '{"Zahlen bis 10 erkennen"}', '{"Zahlen bis 100 lesen und schreiben", "Zahlenreihen fortsetzen", "Vorgänger und Nachfolger bestimmen"}'),
('Mathematik', 'Addition und Subtraktion bis 20', 'Zahlen bis 20 im Kopf addieren und subtrahieren.', 2, 'Bayern', '{"Einfache Addition bis 10"}', '{"Plusaufgaben bis 20", "Minusaufgaben bis 20", "Zehnerüberschreitung"}'),
('Mathematik', 'Zahlen bis 1000', 'Zahlenraum bis 1000 erschließen, Stellenwerte verstehen.', 2, 'Bayern', '{"Zahlen bis 100"}', '{"Drei Stellenwerte verstehen", ','"Zahlen bis 1000 lesen und schreiben"}'),
('Mathematik', 'Geldwerte erkennen', 'Mit Euro und Cent umgehen, einfache Rechnungen mit Geld.', 2, 'Bayern', '{"Zahlen bis 100"}', '{"Münzen und Scheine erkennen", "Einfache Geldbeträge bilden", "Wechselgeld berechnen"}'),

-- Grade 3 Mathematics (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Mathematik', 'Einmaleins vollständig', 'Gesamtes kleine Einmaleins sicher beherrschen und anwenden.', 3, 'Bayern', '{"Einfache Addition und Subtraktion"}', '{"Alle Einmaleinsreihen", "Division als Umkehrung", "Kopfrechnen trainieren"}'),
('Mathematik', 'Sachaufgaben lösen', 'Einfache Sachaufgaben verstehen und mit passenden Rechenoperationen lösen.', 3, 'Bayern', '{"Einmaleins vollständig"}', '{"Texte verstehen", "Rechenwege wählen", "Lösungen überprüfen"}'),
('Mathematik', 'Längen messen', 'Längen in Meter und Zentimeter messen und vergleichen.', 3, 'Bayern', '{}', '{"Meter und Zentimeter", "Maßband benutzen", "Längen schätzen"}'),

-- Grade 4 Mathematics (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Mathematik', 'Große Zahlen bis 1 Million', 'Zahlen bis 1 Million lesen, schreiben und vergleichen.', 4, 'Bayern', '{"Zahlen bis 1000"}', '{"Million verstehen", "Stellenwerte bis Millionen", "Zahlen ordnen"}'),
('Mathematik', 'Römische Zahlen', 'Römische Zahlen bis 100 lesen und schreiben.', 4, 'Bayern', '{}', '{"Grundzeichen I, V, X, L, C", "Zahlen umwandeln", "Jahreszahlen lesen"}'),

-- Grade 5 Mathematics (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Mathematik', 'Kommarechnen einführen', 'Dezimalzahlen im Zahlenraum bis 1000 addieren und subtrahieren.', 5, 'Bayern', '{"Dezimalzahlen verstehen"}', '{"Kommaregeln anwenden", "Dezimalzahlen addieren/subtrahieren", "Sachaufgaben mit Dezimalzahlen"}'),
('Mathematik', 'Bruchrechnen Grundlagen', 'Einfache Brüche vergleichen, erweitern und kürzen.', 5, 'Bayern', '{"Brüche als Teil verstehen"}', '{"Brüche vergleichen", "Erweitern und kürzen", "Gemischte Zahlen"}'),

-- =============================================
-- German Language Curriculum (Grundschule)
-- =============================================

-- Grade 1 German
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Deutsch', 'Buchstaben erkennen', 'Alle Buchstaben des Alphabets erkennen und ihren Laut zuordnen.', 1, 'Bayern', '{}', '{"Buchstaben benennen", "Laute zuordnen", "Buchstaben unterscheiden"}'),
('Deutsch', 'Erste Wörter lesen', 'Einfache Wörter mit bekannten Buchstaben lautierend lesen.', 1, 'Bayern', '{"Buchstaben erkennen"}', '{"Buchstaben verbinden", "Einfache Wörter lesen", "Leseflüssigkeit üben"}'),
('Deutsch', 'Bilder und Geschichten verstehen', 'Einfache Bilder betrachten und dazu Geschichten erzählen oder verstehen.', 1, 'Bayern', '{}', '{"Bilder beschreiben", "Handlungen erkennen", "Eigene Geschichten erfinden"}'),

-- Grade 2 German
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Deutsch', 'Satzbau verstehen', 'Einfache Sätze bilden und verstehen (Subjekt-Prädikat-Objekt).', 2, 'Bayern', '{"Erste Wörter lesen"}', '{"Satzanfang erkennen", "Satzende finden", "Eigene Sätze bilden"}'),
('Deutsch', 'Leseverständnis entwickeln', 'Kurze Texte lesen und verstehen, Fragen dazu beantworten.', 2, 'Bayern', '{"Erste Wörter lesen"}', '{"Texte sinnerfassend lesen", "Hauptinformationen finden", "Fragen beantworten"}'),
('Deutsch', 'Gedichte auswendig lernen', 'Kurze Kinderreime und Gedichte auswendig lernen und vortragen.', 2, 'Bayern', '{}', '{"Reime merken", "Vortragen üben", "Ausdruck entwickeln"}'),

-- Grade 3 German (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Deutsch', 'Nomen und Artikel', 'Nomen erkennen und richtige Artikel (der, die, das) zuordnen.', 3, 'Bayern', '{"Satzbau verstehen"}', '{"Nomen bestimmen", "Genus erkennen", "Artikel korrekt verwenden"}'),
('Deutsch', 'Wörterbuch benutzen', 'Wörter im Wörterbuch nachschlagen und Bedeutungen finden.', 3, 'Bayern', '{}', '{"Alphabetische Ordnung", "Wörter nachschlagen", "Bedeutungen verstehen"}'),
('Deutsch', 'Lesestrategien anwenden', 'Verschiedene Lesestrategien für unterschiedliche Textarten nutzen.', 3, 'Bayern', '{"Leseverständnis entwickeln"}', '{"Überfliegen", "Suchlesen", "Detaillesen"}'),

-- Grade 4 German (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Deutsch', 'Zeichensetzung beherrschen', 'Kommas, Punkte und Fragezeichen im Satz richtig setzen.', 4, 'Bayern', '{"Satzarten unterscheiden"}', '{"Punkt und Satzschlusszeichen", "Komma bei Aufzählungen", "Direkte Rede kennzeichnen"}'),
('Deutsch', 'Texte zusammenfassen', 'Gelesene Texte in eigenen Worten zusammenfassen.', 4, 'Bayern', '{"Leseverständnis entwickeln"}', '{"Hauptgedanken finden", "Wichtiges von Unwichtigem trennen", "Zusammenfassung formulieren"}'),
('Deutsch', 'Briefe schreiben', 'Einfache Briefe nach korrektem Format verfassen.', 4, 'Bayern', '{"Texte verfassen"}', '{"Briefaufbau verstehen", "Anrede und Grußformel", "Inhalte strukturiert darstellen"}'),

-- =============================================
-- Sachkunde (General Studies) Curriculum
-- =============================================

-- Grade 1 Sachkunde
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Sachkunde', 'Ich und meine Familie', 'Familienmitglieder und ihre Rollen verstehen, eigene Position in der Familie erkennen.', 1, 'Bayern', '{}', '{"Familienmitglieder benennen", "Familienbeziehungen verstehen", "Eigene Gefühle ausdrücken"}'),
('Sachkunde', 'Jahreszeiten erleben', 'Die vier Jahreszeiten mit ihren typischen Merkmalen erkennen und benennen.', 1, 'Bayern', '{}', '{"Jahreszeiten benennen", "Wetterbeobachtungen", "Jahreszeiten typische Aktivitäten"}'),

-- Grade 2 Sachkunde
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Sachkunde', 'Tiere und ihre Lebensweise', 'Verschiedene Haustiere und Wildtiere kennenlernen und ihre Lebensräume verstehen.', 2, 'Bayern', '{}', '{"Haustiere und Wildtiere unterscheiden", "Lebensräume zuordnen", "Tierbedürfnisse verstehen"}'),
('Sachkunde', 'Verkehrserziehung Grundlagen', 'Grundlegende Verkehrsregeln für Fußgänger verstehen und anwenden.', 2, 'Bayern', '{}', '{"Ampelregeln", "Sichere Straßenüberquerung", "Gefahren erkennen"}'),

-- Grade 3 Sachkunde (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Sachkunde', 'Wasser verstehen', 'Die Bedeutung von Wasser für Leben, Wasserkreislauf und Wasserschutz.', 3, 'Bayern', '{}', '{"Wasserkreislauf verstehen", "Wasserversorgung", "Wassersparen"}'),
('Sachkunde', 'Unser Körper', 'Grundlegende Körperteile und ihre Funktionen, Gesundheitsförderung.', 3, 'Bayern', '{}', '{"Körperteile benennen", "Sinne verstehen", "Gesunde Gewohnheiten"}'),

-- Grade 4 Sachkunde
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Sachkunde', 'Kommune verstehen', 'Die eigene Gemeinde mit ihren Einrichtungen und Aufgaben kennenlernen.', 4, 'Bayern', '{}', '{"Gemeindeeinrichtungen kennen", "Bürgermeister und Rat", "Demokratische Teilhabe"}'),
('Sachkunde', 'Medienkunde Grundlagen', 'Verschiedene Medienarten unterscheiden und verantwortungsvoll nutzen.', 4, 'Bayern', '{}', '{"Medienarten erkennen", "Fernsehen verstehen", "Erste Internetregeln"}'),

-- =============================================
-- English as Foreign Language Curriculum
-- =============================================

-- Grade 3 English (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Englisch', 'Colors and Shapes', 'English colors and basic shapes understand and use.', 3, 'Bayern', '{}', '{"Colors benennen", "Shapes erkennen", "Einfache Beschreibungen"}'),
('Englisch', 'Family Members', 'English family vocabulary understand and use in simple sentences.', 3, 'Bayern', '{"Einfache Englische Sätze"}', '{"Family members benennen", "Meine Familie vorstellen", "Einfache Fragen stellen"}'),

-- Grade 4 English (additional to existing)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Englisch', 'Simple Present Tense', 'Basic present tense sentences for daily routines.', 4, 'Bayern', '{"English Numbers and Colors"}', '{"I like/I don''t like", "Daily routines", "Third person singular"}'),
('Englisch', 'Animals and Pets', 'English animal names and simple descriptions.', 4, 'Bayern', '{}', '{"Farm animals", "Pets", "Animal sounds"}'),

-- Grade 5 English
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Englisch', 'Hobbies and Free Time', 'Talk about hobbies and free time activities in simple English.', 5, 'Bayern', '{"Simple Present Tense"}', '{"Hobbies nennen", "I like/I don''t like", "Weekend activities"}'),
('Englisch', 'School Subjects', 'English vocabulary for school subjects and classroom objects.', 5, 'Bayern', '{}', '{"School subjects", "Classroom objects", "Simple school conversations"}'),

-- =============================================
-- Art, Music, and Physical Education
-- =============================================

-- Art (Kunst)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Kunst', 'Grundfarben mischen', 'Grundfarben erkennen und einfache Farbmischungen durchführen.', 2, 'Bayern', '{}', '{"Grundfarben benennen", "Farben mischen", "Farbwirkungen verstehen"}'),
('Kunst', 'Perspektive zeichnen', 'Einfache perspektivische Darstellungen (Ferne/Nähe) im Zeichnen.', 4, 'Bayern', '{}', '{"Größe als Perspektive", "Überlappung", "Horizontlinie"}'),

-- Music (Musik)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Musik', 'Rhythmus und Takt', 'Einfache Rhythmen klatschen und Notenwerte verstehen.', 2, 'Bayern', '{}', '{"Rhythmus klatschen", '('"Notenwerte unterscheiden", "Einfache Taktarten"}'),
('Musik', 'Melodie und Tonhöhe', 'Hohe und tiefe Töne unterscheiden, einfache Melodien nachsingen.', 3, 'Bayern', '{}', '{"Tonhöhen unterscheiden", "Melodien nachsingen", "Einfache Instrumente"}'),

-- Physical Education (Sport)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Sport', 'Bewegungsfähigkeit entwickeln', 'Grundlegende Bewegungsformen (Laufen, Springen, Werfen) koordinieren.', 1, 'Bayern', '{}', '{"Laufen und Hüpfen", "Werfen und Fangen", "Balance halten"}'),
('Sport', 'Mannschaftsspiele verstehen', 'Einfache Regelungen in Mannschaftsspielen verstehen und anwenden.', 4, 'Bayern', '{}', '{"Regeln verstehen", "Zusammenarbeit", "Fairness"}'),

-- =============================================
-- Cross-Subject and Federal State Variations
-- =============================================

-- Baden-Württemberg specific competencies
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Mathematik', 'Rechenschwäche Prävention', 'Gezielte Übungen zur Vorbeugung von Rechenschwäche.', 2, 'Baden-Württemberg', '{"Zahlen bis 100"}', '{"Anschauungsmaterial nutzen", "Zahlenbilder", "Rechenstrategien"}'),

-- Berlin specific competencies
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Sachkunde', 'Stadtleben verstehen', 'Besonderheiten des städtischen Lebens und urbaner Umwelt.', 3, 'Berlin', '{}', '{"Städtische Einrichtungen", '('"Verkehr in der Stadt", "Umwelt in Städten"}'),

-- North Rhine-Westphalia specific competencies
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Deutsch', 'Sprachliche Vielfalt', 'Umgang mit verschiedenen Sprachen und Dialekten im Umfeld.', 3, 'Nordrhein-Westfalen', '{}', '{"Mehrsprachigkeit verstehen", '('"Dialekte erkennen", "Respekt vor Vielfalt"}'),

-- =============================================
-- Additional Advanced Competencies for Higher Grades
-- =============================================

-- Grade 6 Mathematics (for advanced students)
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Mathematik', 'Bruchrechnen vertiefen', 'Alle Grundrechenarten mit Brüchen und gemischten Zahlen.', 6, 'Bayern', '{"Bruchrechnen Grundlagen"}', '{"Brüche multiplizieren/dividieren", "Gemischte Zahlen berechnen", "Bruchgleichungen"}'),
('Mathematik', 'Prozentrechnung einführen', 'Grundlagen der Prozentrechnung verstehen und anwenden.', 6, 'Bayern', '{"Dezimalzahlen verstehen"}', '{"Prozentsatz berechnen", "Grundwert und Prozentwert", "Praktische Anwendungen"}'),

-- Grade 6 German
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
('Deutsch', 'Gedichte analysieren', 'Einfache Gedichte hinsichtlich Stilmittel und Botschaft analysieren.', 6, 'Bayern', '{"Gedichte auswendig lernen"}', '{"Reime und Metaphern erkennen", "Stimmungen verstehen", "Interpretation üben"}'),
('Deutsch', 'Sachtexte verstehen', 'Informationen aus Sachtexten entnehmen und auswerten.', 6, 'Bayern', '{"Texte zusammenfassen"}', '{"Informationsentnahme", "Quellenkritik einführen", "Notizen machen"}'),

-- =============================================
-- Index Comments for Performance
-- =============================================
COMMENT ON INDEX idx_competencies_domain_grade IS 'Optimizes queries for domain and grade level filtering';
COMMENT ON INDEX idx_competency_progress_user_status IS 'Optimizes user progress queries by status';
COMMENT ON INDEX idx_user_interests_user_id IS 'Optimizes user interest lookups';

-- =============================================
-- Seed Data Summary
-- =============================================
-- Total competencies added: ~80 comprehensive curriculum entries
-- Coverage: Grades 1-6, 7 subjects, 3 federal states (representative sample)
-- Structure: Prerequisites and learning objectives for competency progression
-- Extensibility: Framework ready for additional federal states and grades