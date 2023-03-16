module.exports.get404Page = (req,res) => {
    res.status(404);
    res.render('error/404', {title: 'Found Not Page'});                                                            
};

module.exports.get500Page = (req,res) => {
    res.status(500);
    res.render('error/500', {title: 'Error Page'});                                                            
};