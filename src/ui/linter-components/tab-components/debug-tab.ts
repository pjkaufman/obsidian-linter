import log from 'loglevel';
import LinterPlugin from 'src/main';
import {Tab} from './tab';
import {TextBoxFull} from 'src/ui/components/text-box-full';
import {setElContent} from 'src/ui/helpers';
import {logsFromLastRun, setLogLevel} from 'src/utils/logger';
import {getTextInLanguage} from 'src/lang/helpers';
import {DropdownRecordInfo, DropdownSetting} from 'src/ui/components/dropdown-setting';
import {ToggleSetting} from 'src/ui/components/toggle-setting';

const logLevels = Object.keys(log.levels) as string[];

export class DebugTab extends Tab {
  constructor(navEl: HTMLElement, settingsEl: HTMLElement, isMobile: boolean, plugin: LinterPlugin) {
    super(navEl, settingsEl, 'Debug', isMobile, plugin);
    this.display();
  }

  display(): void {
    let tempDiv = this.contentEl.createDiv();
    const logLevelDropdownRecordInfo: DropdownRecordInfo = {
      isForEnum: true,
      values: logLevels,
      descriptions: [],
    };

    this.addSettingSearchInfoForGeneralSettings(new DropdownSetting(tempDiv, 'tabs.debug.log-level.name', 'tabs.debug.log-level.description', 'logLevel', this.plugin, logLevelDropdownRecordInfo, async () => {
      setLogLevel(this.plugin.settings.logLevel);
    }));

    tempDiv = this.contentEl.createDiv();
    let settingName = getTextInLanguage('tabs.debug.linter-config.name');
    let settingDesc = getTextInLanguage('tabs.debug.linter-config.description');
    const configDisplay = new TextBoxFull(tempDiv, settingName, settingDesc);
    configDisplay.inputEl.setText(JSON.stringify(this.plugin.settings, null, 2));

    this.addSettingSearchInfo(tempDiv, settingName, settingDesc);

    let logDisplay: TextBoxFull = null;
    tempDiv = this.contentEl.createDiv();
    const recordLintOnSaveLogsSetting = new ToggleSetting(tempDiv, 'tabs.debug.log-collection.name', 'tabs.debug.log-collection.description', 'recordLintOnSaveLogs', this.plugin, (value: boolean) => {
      if (value) {
        logDisplay.unhide();
      } else {
        logDisplay.hide();
      }
    });
    this.addSettingSearchInfoForGeneralSettings(recordLintOnSaveLogsSetting);

    tempDiv = this.contentEl.createDiv();
    settingName = getTextInLanguage('tabs.debug.linter-logs.name');
    settingDesc = getTextInLanguage('tabs.debug.linter-logs.description');
    logDisplay = new TextBoxFull(tempDiv, settingName, '');
    logDisplay.inputEl.setText(logsFromLastRun.join('\n'));
    setElContent(settingDesc, logDisplay.descEl);

    if (!recordLintOnSaveLogsSetting.getBoolean()) {
      logDisplay.hide();
    }

    this.addSettingSearchInfo(tempDiv, settingName, settingDesc);
  }
}
