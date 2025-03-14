import React from 'react';
import { useTranslation } from '../../../core/i18n';

interface ConfirmDialogProps {
	message: string;
	show: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, show, onConfirm, onCancel }) => {
	const { t } = useTranslation();

	if (!show) return null;

	return (
		<div className="confirm-overlay">
			<div className="confirm-dialog">
				<p>{message}</p>
				<div className="confirm-buttons">
					<button className="confirm-cancel" onClick={onCancel}>{t('common.cancel')}</button>
					<button className="confirm-ok" onClick={onConfirm}>{t('common.confirm')}</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmDialog; 