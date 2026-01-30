import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Activity, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

const TRANSLATIONS = {
  en: {
    title: 'Voice Stress Detector',
    description: 'Record your voice for real-time stress analysis',
    selectLanguage: 'Select Language',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    recording: 'Recording... Speak naturally about how you\'re feeling',
    waiting: 'Click to start recording (15 seconds max)',
    analyzing: 'Analyzing voice patterns...',
    recordingStarted: 'Recording Started',
    speakNaturally: 'Speak naturally for 10-15 seconds for best results',
    analysisComplete: 'Analysis Complete',
    stressLevel: 'Stress Level',
    suggested: 'Suggested',
    micAccessError: 'Microphone Access Error',
    allowMicAccess: 'Please allow microphone access to use voice stress detection',
    analysisError: 'Analysis Error',
    analysisFailed: 'Failed to analyze voice stress. Please try again.',
  },
  kn: {
    title: 'ಧ್ವನಿ ಒತ್ತಡ ಪತ್ತೆಕಾರಕ',
    description: 'ನೈಜ-ಸಮಯದ ಒತ್ತಡ ವಿಶ್ಲೇಷಣೆಗಾಗಿ ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ',
    selectLanguage: 'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
    startRecording: 'ರೆಕಾರ್ಡಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ',
    stopRecording: 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ',
    recording: 'ರೆಕಾರ್ಡಿಂಗ್... ನೀವು ಹೇಗೆ ಭಾವಿಸುತ್ತಿದ್ದೀರಿ ಎಂಬುದರ ಬಗ್ಗೆ ಸ್ವಾಭಾವಿಕವಾಗಿ ಮಾತನಾಡಿ',
    waiting: 'ರೆಕಾರ್ಡಿಂಗ್ ಪ್ರಾರಂಭಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ (ಗರಿಷ್ಠ 15 ಸೆಕೆಂಡುಗಳು)',
    analyzing: 'ಧ್ವನಿ ಮಾದರಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    recordingStarted: 'ರೆಕಾರ್ಡಿಂಗ್ ಪ್ರಾರಂಭವಾಗಿದೆ',
    speakNaturally: 'ಉತ್ತಮ ಫಲಿತಾಂಶಗಳಿಗಾಗಿ 10-15 ಸೆಕೆಂಡುಗಳ ಕಾಲ ಸ್ವಾಭಾವಿಕವಾಗಿ ಮಾತನಾಡಿ',
    analysisComplete: 'ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
    stressLevel: 'ಒತ್ತಡದ ಮಟ್ಟ',
    suggested: 'ಸೂಚಿಸಲಾಗಿದೆ',
    micAccessError: 'ಮೈಕ್ರೋಫೋನ್ ಪ್ರವೇಶ ದೋಷ',
    allowMicAccess: 'ಧ್ವನಿ ಒತ್ತಡ ಪತ್ತೆಯನ್ನು ಬಳಸಲು ದಯವಿಟ್ಟು ಮೈಕ್ರೋಫೋನ್ ಪ್ರವೇಶವನ್ನು ಅನುಮತಿಸಿ',
    analysisError: 'ವಿಶ್ಲೇಷಣೆ ದೋಷ',
    analysisFailed: 'ಧ್ವನಿ ಒತ್ತಡವನ್ನು ವಿಶ್ಲೇಷಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  },
  hi: {
    title: 'वॉयस स्ट्रेस डिटेक्टर',
    description: 'रियल-टाइम तनाव विश्लेषण के लिए अपनी आवाज़ रिकॉर्ड करें',
    selectLanguage: 'भाषा चुनें',
    startRecording: 'रिकॉर्डिंग शुरू करें',
    stopRecording: 'रिकॉर्डिंग बंद करें',
    recording: 'रिकॉर्डिंग... स्वाभाविक रूप से बोलें कि आप कैसा महसूस कर रहे हैं',
    waiting: 'रिकॉर्डिंग शुरू करने के लिए क्लिक करें (अधिकतम 15 सेकंड)',
    analyzing: 'आवाज़ पैटर्न का विश्लेषण किया जा रहा है...',
    recordingStarted: 'रिकॉर्डिंग शुरू हुई',
    speakNaturally: 'सर्वोत्तम परिणामों के लिए 10-15 सेकंड तक स्वाभाविक रूप से बोलें',
    analysisComplete: 'विश्लेषण पूर्ण',
    stressLevel: 'तनाव स्तर',
    suggested: 'सुझाया गया',
    micAccessError: 'माइक्रोफोन एक्सेस त्रुटि',
    allowMicAccess: 'कृपया वॉयस स्ट्रेस डिटेक्शन का उपयोग करने के लिए माइक्रोफोन एक्सेस की अनुमति दें',
    analysisError: 'विश्लेषण त्रुटि',
    analysisFailed: 'आवाज़ तनाव का विश्लेषण करने में विफल। कृपया पुनः प्रयास करें।',
  },
  ta: {
    title: 'குரல் அழுத்தம் கண்டறிதல்',
    description: 'நேரடி நேர அழுத்த பகுப்பாய்வுக்காக உங்கள் குரலை பதிவு செய்யுங்கள்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    startRecording: 'பதிவைத் தொடங்கவும்',
    stopRecording: 'பதிவை நிறுத்தவும்',
    recording: 'பதிவு செய்யப்படுகிறது... நீங்கள் எப்படி உணர்கிறீர்கள் என்பதைப் பற்றி இயற்கையாக பேசுங்கள்',
    waiting: 'பதிவைத் தொடங்க கிளிக் செய்யவும் (அதிகபட்சம் 15 வினாடிகள்)',
    analyzing: 'குரல் வடிவங்கள் பகுப்பாய்வு செய்யப்படுகின்றன...',
    recordingStarted: 'பதிவு தொடங்கியது',
    speakNaturally: 'சிறந்த முடிவுகளுக்கு 10-15 வினாடிகள் இயற்கையாக பேசுங்கள்',
    analysisComplete: 'பகுப்பாய்வு முடிந்தது',
    stressLevel: 'அழுத்த நிலை',
    suggested: 'பரிந்துரைக்கப்பட்டது',
    micAccessError: 'மைக்ரோஃபோன் அணுகல் பிழை',
    allowMicAccess: 'குரல் அழுத்தம் கண்டறிதலைப் பயன்படுத்த மைக்ரோஃபோன் அணுகலை அனுமதிக்கவும்',
    analysisError: 'பகுப்பாய்வு பிழை',
    analysisFailed: 'குரல் அழுத்தத்தை பகுப்பாய்வு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
  },
  te: {
    title: 'వాయిస్ స్ట్రెస్ డిటెక్టర్',
    description: 'రియల్-టైమ్ ఒత్తిడి విశ్లేషణ కోసం మీ వాయిస్‌ను రికార్డ్ చేయండి',
    selectLanguage: 'భాషను ఎంచుకోండి',
    startRecording: 'రికార్డింగ్ ప్రారంభించండి',
    stopRecording: 'రికార్డింగ్ ఆపివేయండి',
    recording: 'రికార్డింగ్... మీరు ఎలా ఫీల్ అవుతున్నారో సహజంగా మాట్లాడండి',
    waiting: 'రికార్డింగ్ ప్రారంభించడానికి క్లిక్ చేయండి (గరిష్టంగా 15 సెకన్లు)',
    analyzing: 'వాయిస్ నమూనాలు విశ్లేషించబడుతున్నాయి...',
    recordingStarted: 'రికార్డింగ్ ప్రారంభమైంది',
    speakNaturally: 'ఉత్తమ ఫలితాల కోసం 10-15 సెకన్లు సహజంగా మాట్లాడండి',
    analysisComplete: 'విశ్లేషణ పూర్తయింది',
    stressLevel: 'ఒత్తిడి స్థాయి',
    suggested: 'సూచించబడింది',
    micAccessError: 'మైక్రోఫోన్ యాక్సెస్ ఎర్రర్',
    allowMicAccess: 'వాయిస్ స్ట్రెస్ డిటెక్షన్ ఉపయోగించడానికి మైక్రోఫోన్ యాక్సెస్‌ను అనుమతించండి',
    analysisError: 'విశ్లేషణ ఎర్రర్',
    analysisFailed: 'వాయిస్ ఒత్తిడిని విశ్లేషించడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
  },
};

interface VoiceStressDetectorProps {
  onStressDetected: (stressLevel: number) => void;
}

export const VoiceStressDetector = ({ onStressDetected }: VoiceStressDetectorProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const t = TRANSLATIONS[selectedLanguage as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await analyzeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: t.recordingStarted,
        description: t.speakNaturally,
      });

      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      }, 15000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: t.micAccessError,
        description: t.allowMicAccess,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeAudio = async (audioBlob: Blob) => {
    setIsAnalyzing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        // Simulate stress detection (in production, this would call ML model)
        const mockStressScore = Math.random() * 0.7 + 0.2; // 0.2 to 0.9
        const languageName = LANGUAGES.find(lang => lang.code === selectedLanguage)?.name || 'English';
        const mockIntervention = mockStressScore > 0.6 ? 'Breathing Exercise' : 'Calming Music';
        const mockEffectiveness = Math.random() * 0.4 + 0.6; // 0.6 to 1.0

        // Extract mock features
        const mockFeatures = {
          pitch_mean: Math.random() * 100 + 150,
          energy_mean: Math.random() * 0.5 + 0.5,
          speech_rate: Math.random() * 2 + 3,
          hnr: Math.random() * 10 + 10,
          jitter: Math.random() * 0.5 + 0.3,
          shimmer: Math.random() * 2 + 2
        };

        // Store in database via edge function
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const sessionId = `session_${Date.now()}`;
          
          const { data, error } = await supabase.functions.invoke('api-data-ingestion', {
            body: {
              user_id: user.id,
              session_id: sessionId,
              stress_score: mockStressScore,
              language: languageName,
              intervention: mockIntervention,
              effectiveness: mockEffectiveness,
              features: mockFeatures,
            }
          });

          if (error) {
            throw new Error(error.message || 'Failed to save session data');
          }

          onStressDetected(mockStressScore);

          toast({
            title: "Analysis Complete",
            description: `Stress Level: ${(mockStressScore * 100).toFixed(0)}% | Suggested: ${mockIntervention}`,
          });
        }
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      toast({
        title: t.analysisError,
        description: t.analysisFailed,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t.selectLanguage}
          </label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.native} ({lang.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className={`relative p-8 rounded-full ${isRecording ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted'}`}>
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            )}
            <Mic className={`h-12 w-12 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`} />
          </div>

          {!isRecording && !isAnalyzing && (
            <Button onClick={startRecording} size="lg" className="w-full">
              <Mic className="h-4 w-4 mr-2" />
              {t.startRecording}
            </Button>
          )}

          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" size="lg" className="w-full">
              <MicOff className="h-4 w-4 mr-2" />
              {t.stopRecording}
            </Button>
          )}

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>{t.analyzing}</span>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground text-center">
          {isRecording ? t.recording : t.waiting}
        </div>
      </CardContent>
    </Card>
  );
};
