import React from 'react';
import { SearchBox } from '@/_components/PageSearchBox';
import { useTranslation } from 'react-i18next';
import { useScreenReader } from '@/modules/common/hooks';

export default function HomeHeader({ onSearchSubmit, darkMode, appType }) {
  const { t } = useTranslation();
  const { speak } = useScreenReader();
  const page = appType === 'workflow' ? 'workflows' : 'apps';

  const placeholderText =
    page === 'apps'
      ? appType == 'module'
        ? 'Search modules in this workspace'
        : t('globals.searchItem', 'Search apps in this workspace')
      : t('globals.workflowsSearchItem', 'Search workflows in this workspace');

  const handleSearchFocus = () => {
    const itemType = appType === 'workflow' ? 'workflows' : appType === 'module' ? 'modules' : 'apps';
    speak(`Search ${itemType} input field`);
  };

  return (
    <div className="home-search-holder">
      <SearchBox
        dataCy={'home-page'}
        className="border-0 homepage-search"
        onSubmit={onSearchSubmit}
        darkMode={darkMode}
        placeholder={placeholderText}
        width={'100%'}
        onFocus={handleSearchFocus}
      />
    </div>
  );
}
