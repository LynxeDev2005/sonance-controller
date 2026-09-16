import { VoiceIntentMatch } from '../types';

export class VoiceService {
  /**
   * Parses spoken transcription and matches it to a PC power action.
   */
  static parseIntent(spokenText: string): VoiceIntentMatch {
    const text = spokenText.toLowerCase().trim();

    if (!text) {
      return {
        action: 'unknown',
        confidence: 0,
        spokenText: '',
        description: 'No speech detected.',
      };
    }

    // Wake / Turn On patterns
    if (
      text.includes('turn on') ||
      text.includes('wake') ||
      text.includes('power on') ||
      text.includes('boot') ||
      text.includes('start up') ||
      text.includes('start pc') ||
      text.includes('switch on') ||
      text.includes('open pc')
    ) {
      return {
        action: 'wake',
        confidence: 0.95,
        spokenText,
        description: 'Wake-on-LAN: Broadcasting magic packet to power on PC.',
      };
    }

    // Shutdown / Turn Off patterns
    if (
      text.includes('shut down') ||
      text.includes('shutdown') ||
      text.includes('turn off') ||
      text.includes('power off') ||
      text.includes('switch off') ||
      text.includes('kill pc')
    ) {
      return {
        action: 'shutdown',
        confidence: 0.95,
        spokenText,
        description: 'Shutdown: Initiating Windows shutdown sequence.',
      };
    }

    // Restart / Reboot patterns
    if (
      text.includes('restart') ||
      text.includes('reboot') ||
      text.includes('reset pc') ||
      text.includes('re start')
    ) {
      return {
        action: 'restart',
        confidence: 0.95,
        spokenText,
        description: 'Restart: Initiating Windows reboot sequence.',
      };
    }

    // Sleep patterns
    if (
      text.includes('sleep') ||
      text.includes('suspend') ||
      text.includes('standby') ||
      text.includes('hibernate')
    ) {
      return {
        action: 'sleep',
        confidence: 0.9,
        spokenText,
        description: 'Sleep: Putting PC into suspend mode.',
      };
    }

    // Lock patterns
    if (
      text.includes('lock') ||
      text.includes('lock screen') ||
      text.includes('lock pc') ||
      text.includes('lock workstation')
    ) {
      return {
        action: 'lock',
        confidence: 0.9,
        spokenText,
        description: 'Lock: Securing Windows desktop session.',
      };
    }

    // Status check patterns
    if (
      text.includes('status') ||
      text.includes('check pc') ||
      text.includes('is pc on') ||
      text.includes('ping') ||
      text.includes('how is pc')
    ) {
      return {
        action: 'status',
        confidence: 0.85,
        spokenText,
        description: 'Status: Querying real-time system stats.',
      };
    }

    return {
      action: 'unknown',
      confidence: 0.2,
      spokenText,
      description: `Unrecognized command: "${spokenText}". Try saying "Turn on PC", "Shutdown", or "Restart".`,
    };
  }
}
