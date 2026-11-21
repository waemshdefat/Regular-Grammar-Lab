import { useState, useMemo } from 'react';
import { SAMPLE_GRAMMARS, SampleGrammar } from './services/sampleGrammars';
import { parseGrammarFromText } from './services/grammarParser';
import { classifyGrammar } from './services/grammarClassifier';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { GrammarBuilder } from './components/GrammarBuilder/GrammarBuilder';
import { ClassificationView } from './components/Classification/ClassificationView';
import { AutomatonPanel } from './components/AutomatonView/AutomatonPanel';
import { StringGeneratorView } from './components/StringGenerator/StringGeneratorView';
import { NfaToGrammarView } from './components/NfaToGrammar/NfaToGrammarView';
import { LanguageExplorerView } from './components/LanguageExplorer/LanguageExplorerView';
import { LearningCenterView } from './components/LearningCenter/LearningCenterView';
import { PracticeQuizView } from './components/PracticeQuiz/PracticeQuizView';
import { AboutProjectView } from './components/AboutProject/AboutProjectView';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Active Grammar State
  const [rawGrammarText, setRawGrammarText] = useState<string>(SAMPLE_GRAMMARS[0].rawText);
  const [customStartSymbol, setCustomStartSymbol] = useState<string | undefined>(SAMPLE_GRAMMARS[0].startSymbol);
  const [currentSampleDesc, setCurrentSampleDesc] = useState<string>(SAMPLE_GRAMMARS[0].languageDesc);
  const [currentSuggestedInputs, setCurrentSuggestedInputs] = useState<{ input: string; expected: boolean }[]>(
    SAMPLE_GRAMMARS[0].suggestedInputs
  );

  // Cross-component communication state (e.g. testing a generated string in Automaton)
  const [simulatorPresetString, setSimulatorPresetString] = useState<string | undefined>(undefined);

  // Parse Grammar Live
  const { grammar, errors, warnings } = useMemo(() => {
    return parseGrammarFromText(rawGrammarText, customStartSymbol);
  }, [rawGrammarText, customStartSymbol]);

  // Classify Grammar Live
  const classification = useMemo(() => {
    return classifyGrammar(grammar);
  }, [grammar]);

  // Handlers
  const handleTextChange = (text: string, newStart?: string) => {
    setRawGrammarText(text);
    if (newStart !== undefined) {
      setCustomStartSymbol(newStart);
    }
  };

  const handleLoadSample = (sample: SampleGrammar) => {
    setRawGrammarText(sample.rawText);
    setCustomStartSymbol(sample.startSymbol);
    setCurrentSampleDesc(sample.languageDesc);
    setCurrentSuggestedInputs(sample.suggestedInputs);
  };

  const handleLoadGrammarFromReverse = (text: string, startSymbol: string) => {
    setRawGrammarText(text);
    setCustomStartSymbol(startSymbol);
    setCurrentSampleDesc('Constructed from NFA reverse mapping');
    setCurrentSuggestedInputs([]);
    setActiveTab('builder');
  };

  const handleTestStringInSimulator = (str: string) => {
    setSimulatorPresetString(str);
    setActiveTab('automaton');
  };

  // Tab Title helper
  const tabTitles: Record<string, string> = {
    dashboard: 'Project Dashboard & Overview',
    builder: 'Grammar Definition & Syntax Editor',
    classification: 'Linearity & Regularity Classification',
    automaton: 'Grammar to NFA & Automaton Simulator',
    generator: 'String Generator & Derivations',
    'nfa-to-grammar': 'Reverse NFA to Regular Grammar',
    explorer: 'Language Explorer & Properties',
    learning: 'Interactive Learning Center (7 Lessons)',
    quiz: 'Practice Exercises & Quiz',
    about: 'Project Presentation & Academic Report'
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        ruleCount={grammar.productions.length}
        isRegular={classification.isRegular}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full">
        <Navbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          activeTabTitle={tabTitles[activeTab] || 'Regular Grammar Lab'}
          isRegular={classification.isRegular}
        />

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              grammar={grammar}
              classification={classification}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'builder' && (
            <div className="space-y-6">
              <GrammarBuilder
                grammar={grammar}
                rawGrammarText={rawGrammarText}
                errors={errors}
                warnings={warnings}
                onTextChange={handleTextChange}
                onLoadSample={handleLoadSample}
              />
              <ClassificationView
                classification={classification}
                onNavigateToAutomaton={() => setActiveTab('automaton')}
              />
            </div>
          )}

          {activeTab === 'classification' && (
            <ClassificationView
              classification={classification}
              onNavigateToAutomaton={() => setActiveTab('automaton')}
            />
          )}

          {activeTab === 'automaton' && (
            <AutomatonPanel
              grammar={grammar}
              isRightLinear={classification.isRightLinear}
              isLeftLinear={classification.isLeftLinear}
              isRegular={classification.isRegular}
              onNavigateToBuilder={() => setActiveTab('builder')}
              presetInputString={simulatorPresetString}
            />
          )}

          {activeTab === 'generator' && (
            <StringGeneratorView
              grammar={grammar}
              onTestInAutomaton={handleTestStringInSimulator}
            />
          )}

          {activeTab === 'nfa-to-grammar' && (
            <NfaToGrammarView
              onLoadGrammarIntoLab={handleLoadGrammarFromReverse}
            />
          )}

          {activeTab === 'explorer' && (
            <LanguageExplorerView
              grammar={grammar}
              isRightLinear={classification.isRightLinear}
              isLeftLinear={classification.isLeftLinear}
              isRegular={classification.isRegular}
              sampleLanguageDesc={currentSampleDesc}
              suggestedInputs={currentSuggestedInputs}
            />
          )}

          {activeTab === 'learning' && (
            <LearningCenterView />
          )}

          {activeTab === 'quiz' && (
            <PracticeQuizView />
          )}

          {activeTab === 'about' && (
            <AboutProjectView />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
